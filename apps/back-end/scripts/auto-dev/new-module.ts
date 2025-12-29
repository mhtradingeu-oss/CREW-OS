import fs from "node:fs";
import path from "node:path";
import { Project, VariableDeclarationKind } from "ts-morph";

const moduleName = process.argv[2]?.trim();

if (!moduleName) {
  console.error("Usage: npm run auto:new-module <module-name>");
  process.exit(1);
}

const toPascalCase = (value: string) =>
  value
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`)
    .join("");

const toCamelCase = (value: string) => {
  const parts = value
    .split(/[-_]/)
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());
  if (parts.length === 0) return value;
  return parts[0] + parts.slice(1).map((segment) => `${segment.charAt(0).toUpperCase()}${segment.slice(1)}`).join("");
};

const pascalName = toPascalCase(moduleName);
const camelName = toCamelCase(moduleName);
const routerAlias = `${camelName}Router`;

const projectRoot = process.cwd();
const moduleDir = path.join(projectRoot, "src", "modules", moduleName);
fs.mkdirSync(moduleDir, { recursive: true });

const servicePath = path.join("src", "modules", moduleName, `${moduleName}.service.ts`);
const controllerPath = path.join("src", "modules", moduleName, `${moduleName}.controller.ts`);
const routesPath = path.join("src", "modules", moduleName, `${moduleName}.routes.ts`);
const indexPath = path.join("src", "modules", moduleName, "index.ts");

const project = new Project({
  tsConfigFilePath: path.join(projectRoot, "tsconfig.json"),
});

const createdFiles: string[] = [];

const fileExists = (relativePath: string) => fs.existsSync(path.join(projectRoot, relativePath));

const createFile = (relativePath: string, builder: (file: import("ts-morph").SourceFile) => void) => {
  if (fileExists(relativePath)) {
    console.warn(`${relativePath} already exists, skipping.`);
    return;
  }

  const sourceFile = project.createSourceFile(relativePath, "", { overwrite: false });
  builder(sourceFile);
  createdFiles.push(relativePath);
};

createFile(servicePath, (sourceFile) => {
  sourceFile.addStatements(`/**
 * ${pascalName} service scaffold.
 * TODO: hook Prisma + business logic.
 */`);

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: `${camelName}Service`,
        initializer: `{
  async list() {
    // TODO: implement list
    return [];
  },
  async getById(id: string) {
    // TODO: implement getById
    return null;
  },
}`,
      },
    ],
  });

  sourceFile.addExportDeclaration({
    namedExports: [`${camelName}Service`],
  });
});

createFile(controllerPath, (sourceFile) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "express",
    namedImports: ["Request", "Response"],
  });

  sourceFile.addImportDeclaration({
    moduleSpecifier: `./${moduleName}.service.js`,
    namedImports: [`${camelName}Service`],
  });

  sourceFile.addFunction({
    name: `list${pascalName}`,
    isExported: true,
    async: true,
    parameters: [
      { name: "req", type: "Request" },
      { name: "res", type: "Response" },
    ],
    statements: `
  const data = await ${camelName}Service.list();
  return res.json({ data });
`,
  });

  sourceFile.addFunction({
    name: `get${pascalName}ById`,
    isExported: true,
    async: true,
    parameters: [
      { name: "req", type: "Request" },
      { name: "res", type: "Response" },
    ],
    statements: `
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ message: "Missing id" });
  }
  const item = await ${camelName}Service.getById(id);
  if (!item) {
    return res.status(404).json({ message: "${pascalName} not found" });
  }
  return res.json({ data: item });
`,
  });
});

createFile(routesPath, (sourceFile) => {
  sourceFile.addImportDeclaration({
    moduleSpecifier: "express",
    namedImports: ["Router"],
  });

  sourceFile.addImportDeclaration({
    moduleSpecifier: `./${moduleName}.controller.js`,
    namedImports: [`list${pascalName}`, `get${pascalName}ById`],
  });

  sourceFile.addVariableStatement({
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: "router",
        initializer: "Router()",
      },
    ],
  });

  sourceFile.addStatements(`
router.get("/", list${pascalName});
router.get("/:id", get${pascalName}ById);

export { router };
`);
});

createFile(indexPath, (sourceFile) => {
  sourceFile.addExportDeclaration({
    moduleSpecifier: `./${moduleName}.routes.js`,
    namedExports: [{ name: "router", alias: routerAlias }],
  });
});

const appUpdates: string[] = [];

const updateAppFile = () => {
  const appFile = project.getSourceFile("src/app.ts");
  if (!appFile) {
    console.warn("src/app.ts not found, skipping wiring.");
    return;
  }

  const moduleImporter = `./modules/${moduleName}/index.js`;
  const alreadyImported = appFile
    .getImportDeclarations()
    .some(
      (decl) =>
        decl.getModuleSpecifierValue() === moduleImporter &&
        decl.getNamedImports().some((named) => named.getName() === routerAlias),
    );

  if (!alreadyImported) {
    appFile.addImportDeclaration({
      moduleSpecifier: moduleImporter,
      namedImports: [{ name: routerAlias }],
    });
    appUpdates.push(`imported ${routerAlias} in src/app.ts`);
  }

  const createAppFn = appFile.getFunction("createApp");
  if (!createAppFn) {
    console.warn("createApp function missing in src/app.ts, skipping route wiring.");
    return;
  }

  const body = createAppFn.getBodyOrThrow();
  const routeSignature = `app.use("/api/v1/${moduleName}"`;
  const alreadyMounted = body
    .getStatements()
    .some((stmt) => stmt.getText().includes(routeSignature) && stmt.getText().includes(routerAlias));

  if (!alreadyMounted) {
    const statements = body.getStatements();
    const errorHandlerIndex = statements.findIndex((stmt) => stmt.getText().includes("app.use(errorHandler"));
    const insertIndex = errorHandlerIndex === -1 ? Math.max(statements.length - 1, 0) : errorHandlerIndex;
    body.insertStatements(insertIndex, `  app.use("/api/v1/${moduleName}", ${routerAlias});`);
    appUpdates.push(`mounted /api/v1/${moduleName}`);
  }
};

updateAppFile();

const main = async () => {
  if (createdFiles.length === 0 && appUpdates.length === 0) {
    console.log(`No changes needed for ${moduleName}.`);
    return;
  }

  await project.save();

  console.log("auto:new-module results:");
  createdFiles.forEach((file) => console.log(`  • created ${file}`));
  appUpdates.forEach((note) => console.log(`  • ${note}`));
};

main().catch((error) => {
  console.error("Failed to generate module:", error);
  process.exit(1);
});
