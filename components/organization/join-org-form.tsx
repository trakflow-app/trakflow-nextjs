'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { joinOrganization } from '@/lib/organization/actions';

// TODO: We need to make the locales file
export default function JoinOrgForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const joinCode = formData.get('join_code') as string;
    const result = await joinOrganization(joinCode);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <Card title="Join Organization">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Enter the join code provided by your organization
        </p>

        <form action={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div>
            <Label htmlFor="join_code">Join Code</Label>
            <Input
              id="join_code"
              name="join_code"
              type="text"
              required
              placeholder="ABCD-1234"
              disabled={loading}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Joining...' : 'Join Organization'}
          </Button>
        </form>
      </div>
    </Card>
  );
}
