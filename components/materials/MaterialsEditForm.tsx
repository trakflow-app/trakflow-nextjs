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
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
// TODO: Create this validation schema
import {
  editMaterialSchema,
  EditMaterialFormInput,
} from '@/lib/validations/materials-validations';
import { MaterialUI } from '@/lib/dal/materials';

// Locales for labels and placeholders
const locales = {
  materialNameLabel: 'Material Name',
  materialNamePlaceholder: 'e.g., Drywall Sheets',
  quantityLabel: 'Quantity on Hand',
  unitLabel: 'Unit of Measure',
  unitPlaceholder: 'e.g., sheets, bags, gallons',
  unitCostLabel: 'Cost per Unit',
  minQuantityLabel: 'Low Stock Threshold',
  updateButton: 'Update Material',
  updatingButton: 'Updating...',
};

interface MaterialEditFormProps {
  material: MaterialUI;
  onSubmit: SubmitHandler<EditMaterialFormInput>;
  isSubmitting: boolean;
}

export function MaterialEditForm({
  material,
  onSubmit,
  isSubmitting,
}: MaterialEditFormProps) {
  const form = useForm<EditMaterialFormInput>({
    resolver: zodResolver(editMaterialSchema),
    defaultValues: {
      name: material.name || '',
      quantity: material.quantity || 0,
      unit: material.unit || '',
      unitCost: material.unitCost || 0,
      minQuantity: material.minQuantity || 0,
    },
  });

  // Reset form if the material prop changes
  useEffect(() => {
    form.reset({
      name: material.name,
      quantity: material.quantity,
      unit: material.unit,
      unitCost: material.unitCost,
      minQuantity: material.minQuantity,
    });
  }, [material, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{locales.materialNameLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={locales.materialNamePlaceholder}
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{locales.quantityLabel}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled={isSubmitting}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{locales.unitLabel}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={locales.unitPlaceholder}
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{locales.unitCostLabel}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    disabled={isSubmitting}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="minQuantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{locales.minQuantityLabel}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    disabled={isSubmitting}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? locales.updatingButton : locales.updateButton}
          </Button>
        </div>
      </form>
    </Form>
  );
}
