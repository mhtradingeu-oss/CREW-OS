import re
from pathlib import Path

MIGRATIONS_DIR = Path('apps/back-end/prisma/migrations')


def find_do_blocks(text):
    blocks = []
    start = 0
    while True:
        start_idx = text.find('DO $$', start)
        if start_idx == -1:
            break
        end_idx = text.find('END $$;', start_idx)
        if end_idx == -1:
            break
        blocks.append((start_idx, end_idx + len('END $$;')))
        start = end_idx + len('END $$;')
    return blocks


def inside_do_block(idx, blocks):
    for start, end in blocks:
        if start <= idx < end:
            return True
    return False


def add_if_not_exists_to_create_table(text):
    return re.sub(r'CREATE TABLE(?!\s+IF\s+NOT\s+EXISTS)', 'CREATE TABLE IF NOT EXISTS', text)


def add_if_not_exists_to_add_column(text):
    return re.sub(r'ADD COLUMN(?!\s+IF\s+NOT\s+EXISTS)', 'ADD COLUMN IF NOT EXISTS', text)


def guard_alter_type_add_value(text):
    pattern = re.compile(r'ALTER TYPE\s+"([^\"]+)"\s+ADD VALUE\s+([^;]+);', re.S)
    blocks = find_do_blocks(text)

    def replacer(match):
        if inside_do_block(match.start(), blocks):
            return match.group(0)
        type_name = match.group(1)
        value = match.group(2).strip()
        guard = (
            "DO $$\n"
            "BEGIN\n"
            "  IF NOT EXISTS (\n"
            "    SELECT 1\n"
            f"    FROM unnest(enum_range(NULL::\"{type_name}\")) AS v\n"
            f"    WHERE v = {value}\n"
            "  ) THEN\n"
            f"    {match.group(0)}\n"
            "  END IF;\n"
            "END $$;\n"
        )
        return guard

    return pattern.sub(replacer, text)


def guard_create_type(text):
    pattern = re.compile(r'CREATE TYPE\s+"([^\"]+)"\s+AS\s+ENUM\s*\((.*?)\);', re.S)
    blocks = find_do_blocks(text)

    def replacer(match):
        if inside_do_block(match.start(), blocks):
            return match.group(0)
        type_name = match.group(1)
        guard = (
            "DO $$\n"
            "BEGIN\n"
            "  IF NOT EXISTS (\n"
            f"    SELECT 1 FROM pg_type WHERE typname = '{type_name}'\n"
            "  ) THEN\n"
            f"    {match.group(0)}\n"
            "  END IF;\n"
            "END $$;\n"
        )
        return guard

    return pattern.sub(replacer, text)


def guard_add_constraints(text):
    pattern = re.compile(r'ALTER\s+TABLE\s+"([^\"]+)"\s+ADD\s+CONSTRAINT\s+"([^\"]+)"\s+([^;]+);', re.S)
    blocks = find_do_blocks(text)

    def replacer(match):
        if inside_do_block(match.start(), blocks):
            return match.group(0)
        table_name = match.group(1)
        constraint_name = match.group(2)
        rest = match.group(3).strip()
        guard = (
            "DO $$\n"
            "BEGIN\n"
            "  IF NOT EXISTS (\n"
            f"    SELECT 1 FROM pg_constraint WHERE conname = '{constraint_name}'\n"
            "  ) THEN\n"
            f"    ALTER TABLE \"{table_name}\" ADD CONSTRAINT \"{constraint_name}\" {rest};\n"
            "  END IF;\n"
            "END $$;\n"
        )
        return guard

    return pattern.sub(replacer, text)


def guard_create_indexes(text):
    pattern = re.compile(
        r'CREATE\s+(UNIQUE\s+)?INDEX\s+"([^\"]+)"\s+ON\s+"([^\"]+)"\s*\((.*?)\);',
        re.S,
    )
    blocks = find_do_blocks(text)

    def replacer(match):
        if inside_do_block(match.start(), blocks):
            return match.group(0)
        statement = match.group(0)
        if 'IF NOT EXISTS' in statement:
            return statement
        unique = 'UNIQUE ' if match.group(1) else ''
        index_name = match.group(2)
        table_name = match.group(3)
        columns_raw = match.group(4)
        columns_formatted = columns_raw.strip()
        columns = [col.strip().strip('"') for col in columns_raw.split(',') if col.strip()]
        exists_clauses = []
        for col in columns:
            exists_clauses.append(
                'EXISTS (\n'
                '      SELECT 1\n'
                '      FROM information_schema.columns\n'
                '      WHERE table_schema = current_schema()\n'
                f'        AND table_name = "{table_name}"\n'
                f'        AND column_name = "{col}"\n'
                '    )'
            )
        exists_text = '\n  AND '.join(exists_clauses)
        guard = (
            'DO $$\n'
            'BEGIN\n'
            '  IF NOT EXISTS (\n'
            f'    SELECT 1 FROM pg_indexes WHERE indexname = "{index_name}"\n'
            '  )\n'
            f'  AND {exists_text}\n'
            '  THEN\n'
            f'    CREATE {unique}INDEX "{index_name}" ON "{table_name}"({columns_formatted});\n'
            '  END IF;\n'
            'END $$;\n'
        )
        return guard

    return pattern.sub(replacer, text)


def process_migration(path):
    text = path.read_text()
    original = text
    text = add_if_not_exists_to_create_table(text)
    text = add_if_not_exists_to_add_column(text)
    text = guard_alter_type_add_value(text)
    text = guard_create_type(text)
    text = guard_add_constraints(text)
    text = guard_create_indexes(text)

    if text != original:
        path.write_text(text)
        print(f'Updated {path}')


if __name__ == '__main__':
    for migration in sorted(MIGRATIONS_DIR.iterdir()):
        migration_file = migration / 'migration.sql'
        if migration_file.exists():
            process_migration(migration_file)
