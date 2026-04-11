'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { createOrganization } from '@/lib/organization/actions';

export default function CreateOrgForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const result = await createOrganization(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  // TODO: Needs to fix the locales file for cleanup
  return (
    <Card title="Create Organization">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Start your own organization and invite your team
        </p>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            {/** TODO: Create a locales file for this */}
            <Label htmlFor="org_name">Organization Name</Label>
            <Input
              id="org_name"
              name="name"
              type="text"
              required
              placeholder="Acme Construction"
              disabled={loading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Organization'}
          </Button>
        </form>
      </div>
    </Card>
  );
}
