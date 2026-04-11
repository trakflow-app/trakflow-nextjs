'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth/actions';

// TODO: Has to fix the UI and role as well
export default function OwnerPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Owner Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage your organization</p>
          </div>
          <form action={logout}>
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Organization">
            <p className="text-sm text-gray-600">
              Manage organization settings
            </p>
          </Card>

          <Card title="Team Members">
            <p className="text-sm text-gray-600">
              View and manage team members
            </p>
          </Card>

          <Card title="Join Code">
            <p className="text-sm text-gray-600">
              Generate and share join codes
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
