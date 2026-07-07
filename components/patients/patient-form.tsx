"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, type Resolver, useForm } from "react-hook-form";
import { Button } from "~/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "~/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import type { ClinicDTO, PatientCreateInput } from "~/lib/data/types";
import { patientCreateSchema } from "~/lib/schemas";

const GENDER_OPTIONS = [
  ["MALE", "Male"],
  ["FEMALE", "Female"],
  ["OTHER", "Other"],
] as const;

const BLOOD_OPTIONS: [string, string][] = [
  ["UNKNOWN", "Unknown"],
  ["A_POS", "A+"],
  ["A_NEG", "A−"],
  ["B_POS", "B+"],
  ["B_NEG", "B−"],
  ["AB_POS", "AB+"],
  ["AB_NEG", "AB−"],
  ["O_POS", "O+"],
  ["O_NEG", "O−"],
];
const BLOOD_LABEL = Object.fromEntries(BLOOD_OPTIONS);

export interface PatientFormProps {
  mode: "create" | "edit";
  clinics: ClinicDTO[];
  defaultValues: Partial<PatientCreateInput>;
  onSubmit: (values: PatientCreateInput) => void;
  isPending?: boolean;
  onCancel?: () => void;
}

export function PatientForm({
  mode,
  clinics,
  defaultValues,
  onSubmit,
  isPending,
  onCancel,
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<PatientCreateInput>({
    // Cast: the schema's `.default()` makes input/output types differ; the resolver
    // always produces a fully-defaulted PatientCreateInput at runtime.
    resolver: zodResolver(patientCreateSchema) as Resolver<PatientCreateInput>,
    defaultValues: { bloodGroup: "UNKNOWN", ...defaultValues },
  });

  const emptyToNull = (v: unknown) => (v === "" || v == null ? null : v);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input id="name" aria-invalid={!!errors.name} {...register("name")} />
          {errors.name && <FieldError>{errors.name.message}</FieldError>}
        </Field>

        <Field data-invalid={!!errors.contactNumber}>
          <FieldLabel htmlFor="contactNumber">Contact number</FieldLabel>
          <Input
            id="contactNumber"
            inputMode="tel"
            aria-invalid={!!errors.contactNumber}
            {...register("contactNumber")}
          />
          {errors.contactNumber && (
            <FieldError>{errors.contactNumber.message}</FieldError>
          )}
        </Field>

        <Controller
          control={control}
          name="gender"
          render={({ field }) => (
            <Field data-invalid={!!errors.gender}>
              <FieldLabel>Gender</FieldLabel>
              <ToggleGroup
                value={field.value ? [field.value] : []}
                onValueChange={(vals: string[]) => {
                  const v = vals[vals.length - 1];
                  if (v) field.onChange(v);
                }}
              >
                {GENDER_OPTIONS.map(([val, label]) => (
                  <ToggleGroupItem key={val} value={val}>
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              {errors.gender && <FieldError>Gender is required</FieldError>}
            </Field>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field data-invalid={!!errors.dateOfBirth}>
            <FieldLabel htmlFor="dob">Date of birth</FieldLabel>
            <Input
              id="dob"
              type="date"
              {...register("dateOfBirth", { setValueAs: emptyToNull })}
            />
            {errors.dateOfBirth && (
              <FieldError>{errors.dateOfBirth.message}</FieldError>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="age">Age</FieldLabel>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              {...register("ageYears", {
                setValueAs: (v) => (v === "" || v == null ? null : Number(v)),
              })}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Controller
            control={control}
            name="bloodGroup"
            render={({ field }) => (
              <Field>
                <FieldLabel>Blood group</FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => v && field.onChange(v)}
                >
                  <SelectTrigger>
                    <span>{BLOOD_LABEL[field.value] ?? "Unknown"}</span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {BLOOD_OPTIONS.map(([v, l]) => (
                        <SelectItem key={v} value={v}>
                          {l}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          {mode === "create" ? (
            <Controller
              control={control}
              name="firstClinicId"
              render={({ field }) => (
                <Field data-invalid={!!errors.firstClinicId}>
                  <FieldLabel>Clinic</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={(v) => v && field.onChange(v)}
                  >
                    <SelectTrigger>
                      <span>
                        {clinics.find((c) => c.id === field.value)?.name ??
                          "Select clinic"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {clinics.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {errors.firstClinicId && (
                    <FieldError>Clinic is required</FieldError>
                  )}
                </Field>
              )}
            />
          ) : (
            <Field>
              <FieldLabel htmlFor="clinic-ro">Clinic</FieldLabel>
              <Input
                id="clinic-ro"
                disabled
                readOnly
                value={
                  clinics.find((c) => c.id === defaultValues.firstClinicId)
                    ?.name ?? ""
                }
              />
            </Field>
          )}
        </div>

        <Field>
          <FieldLabel htmlFor="address">Address</FieldLabel>
          <Input
            id="address"
            {...register("address", { setValueAs: emptyToNull })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="allergies">Allergies</FieldLabel>
          <Input
            id="allergies"
            {...register("allergies", { setValueAs: emptyToNull })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="history">Medical history</FieldLabel>
          <Input
            id="history"
            {...register("medicalHistory", { setValueAs: emptyToNull })}
          />
        </Field>
      </FieldGroup>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" size="lg" disabled={isPending}>
          {mode === "create" ? "Register" : "Save"}
        </Button>
      </div>
    </form>
  );
}
