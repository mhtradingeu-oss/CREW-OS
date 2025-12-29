import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  type Control,
  type ControllerFieldState,
  type ControllerRenderProps,
  type FieldValues,
} from "react-hook-form";
import { cn } from "@/lib/utils";

const Form = FormProvider;

type FormFieldProps = {
  control: Control<FieldValues>;
  name: string;
  render: (params: {
    field: ControllerRenderProps<FieldValues, string>;
    fieldState: ControllerFieldState;
  }) => React.ReactElement;
};

const FormField = ({ control, name, render }: FormFieldProps) => (
  <Controller
    control={control}
    name={name as any}
    render={({ field, fieldState }) => render({ field, fieldState })}
  />
);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("space-y-2", className)} {...props} />
  ),
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn("text-sm font-medium leading-none", className)} {...props} />
  ),
);
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <Slot ref={ref} className={cn("w-full", className)} {...props} />
  ),
);
FormControl.displayName = "FormControl";

const FormMessage = ({ className, name }: { className?: string; name: string }) => {
  const {
    formState: { errors },
  } = useFormContext();
  const message = (errors as Record<string, any>)?.[name]?.message as string | undefined;
  if (!message) return null;
  return <p className={cn("text-xs text-red-500", className)}>{message}</p>;
};

export { Form, FormField, FormItem, FormLabel, FormControl, FormMessage };
