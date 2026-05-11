'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo } from 'react';
import { calculateRemainingQuantity } from '@/lib/utils/materials-utils';
import { createUsageSchema } from '@/lib/validations/materials-validations';
import {
  UsageFormInput,
  UsageFormOutput,
  MaterialUsageFormProps,
} from '@/lib/types/materials-types';
import { materialUsageFormLocales } from '@/locales/components/materials/material-usage-form-locales';
import { MATERIAL_USAGE_FORM } from '@/constants/components/materials/form';

/**
 * This is the form for logging the materials usage
 */
export function MaterialUsageForm({
  materialId,
  projectName,
  currentQuantity,
  onSubmit,
  isSubmitting,
  defaultProjectId,
}: MaterialUsageFormProps) {
  // Memoize schema to prevent recreation on every render
  const usageSchema = useMemo(
    () => createUsageSchema(currentQuantity),
    [currentQuantity],
  );

  const form = useForm<UsageFormInput>({
    resolver: zodResolver(usageSchema),
    defaultValues: {
      projectId: defaultProjectId || '',
      quantityUsed: 0,
      notes: '',
    },
  });

  // Watch quantity to calculate remaining stock
  // eslint-disable-next-line react-hooks/incompatible-library
  const quantityUsed = form.watch('quantityUsed');
  const { remaining, isOverLimit, overage } = calculateRemainingQuantity(
    currentQuantity,
    Number(quantityUsed) || 0,
  );

  // Update project when modal opens with specific material
  useEffect(() => {
    if (defaultProjectId) {
      form.setValue('projectId', defaultProjectId);
    }
  }, [defaultProjectId, form]);

  // Wrap submit to inject materialId
  const handleInternalSubmit: SubmitHandler<UsageFormInput> = (data) => {
    onSubmit({ ...(data as UsageFormOutput), materialId });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleInternalSubmit)}
        className="space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>{materialUsageFormLocales.projectLabel}</FormLabel>
            <Input value={projectName} readOnly className="bg-muted" />
          </FormItem>

          <FormItem>
            <FormLabel>{materialUsageFormLocales.inStockLabel}</FormLabel>
            <Input
              value={remaining}
              readOnly
              className={`bg-muted font-mono font-bold ${
                isOverLimit
                  ? MATERIAL_USAGE_FORM.COLORS.OVER_LIMIT
                  : MATERIAL_USAGE_FORM.COLORS.IN_STOCK
              }`}
            />
          </FormItem>
        </div>

        <FormField
          control={form.control}
          name="quantityUsed"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {materialUsageFormLocales.quantityUsedLabel}
              </FormLabel>
              <FormControl>
                <Input
                  type={MATERIAL_USAGE_FORM.INPUT.TYPE}
                  step={MATERIAL_USAGE_FORM.INPUT.STEP}
                  placeholder={materialUsageFormLocales.quantityPlaceholder}
                  autoFocus
                  disabled={isSubmitting}
                  {...field}
                  value={
                    (field.value && field.value !== 0 ? field.value : '') as
                      | string
                      | number
                  }
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    field.onChange(val);
                  }}
                  className={
                    isOverLimit ? MATERIAL_USAGE_FORM.COLORS.BORDER_ERROR : ''
                  }
                />
              </FormControl>
              {isOverLimit && (
                <p
                  className={`text-sm ${MATERIAL_USAGE_FORM.COLORS.OVER_LIMIT}`}
                >
                  {materialUsageFormLocales.quantityExceedsStock}{' '}
                  {overage.toFixed(2)} {materialUsageFormLocales.units}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{materialUsageFormLocales.notesLabel}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={materialUsageFormLocales.notesPlaceholder}
                  {...field}
                  disabled={isSubmitting}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isOverLimit}
          >
            {isSubmitting
              ? materialUsageFormLocales.logging
              : materialUsageFormLocales.confirmConsumption}
          </Button>
        </div>
      </form>
    </Form>
  );
}
