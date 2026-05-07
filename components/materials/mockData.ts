export type Material = {
  id: string;
  name: string;
  unit: string;
  project: string;
  quantity: number;
  minQuantity: number;
  unitCost: number;
};

export const materials: Material[] = [
  {
    id: 'm1',
    name: 'Cement',
    unit: 'bags',
    project: 'Site A',
    quantity: 120,
    minQuantity: 50,
    unitCost: 7.5,
  },
  {
    id: 'm2',
    name: 'Rebar',
    unit: 'pcs',
    project: 'Site B',
    quantity: 40,
    minQuantity: 100,
    unitCost: 12.0,
  },
  {
    id: 'm3',
    name: 'Gravel',
    unit: 'tons',
    project: 'Site A',
    quantity: 8,
    minQuantity: 5,
    unitCost: 22.5,
  },
  {
    id: 'm4',
    name: 'Plywood',
    unit: 'sheets',
    project: 'Site C',
    quantity: 200,
    minQuantity: 30,
    unitCost: 15.25,
  },
  {
    id: 'm5',
    name: 'Nails',
    unit: 'box',
    project: 'Site B',
    quantity: 12,
    minQuantity: 20,
    unitCost: 4.0,
  },
];

export default materials;
