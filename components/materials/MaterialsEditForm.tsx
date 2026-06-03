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
import {
  editMaterialSchema,
  EditMaterialFormInput,
} from '@/lib/validations/materials-validations';
import { MaterialUI } from '@/lib/dal/materials';
import { materialEditFormLocales } from '@/locales/components/materials/materials-edit-form-locales';

interface MaterialEditFormProps {
  material: MaterialUI & { id: string | number };
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
      unitCost: material.unitCost || 0,
      minQuantity: material.minQuantity || 0,
    },
  });

  // Reset form if the material prop changes
  useEffect(() => {
    form.reset({
      name: material.name,
      quantity: material.quantity,
      unitCost: material.unitCost,
      minQuantity: material.minQuantity,
    });
  }, [material, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {materialEditFormLocales.projectContextPrefix}{' '}
          <span className="font-medium text-foreground">
            {material.projectName || materialEditFormLocales.projectFallback}
          </span>
          .
        </p>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{materialEditFormLocales.materialNameLabel}</FormLabel>
              <FormControl>
                <Input
                  placeholder={materialEditFormLocales.materialNamePlaceholder}
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
                <FormLabel>{materialEditFormLocales.quantityLabel}</FormLabel>
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unitCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{materialEditFormLocales.unitCostLabel}</FormLabel>
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
                <FormLabel>
                  {materialEditFormLocales.minQuantityLabel}
                </FormLabel>
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
            {isSubmitting
              ? materialEditFormLocales.updatingButton
              : materialEditFormLocales.updateButton}
          </Button>
        </div>
      </form>
    </Form>
  );
}
