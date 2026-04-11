'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut } from 'lucide-react';
import { logout } from '@/lib/auth/actions';

// TODO: Has to fix the UI and role as well
export default function CrewPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Crew Dashboard</h1>
            <p className="text-gray-600 mt-2">Your dashboard</p>
          </div>
          <form action={logout}>
            <Button variant="outline" type="submit">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </form>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Projects">
            <p className="text-sm text-gray-600">View your projects</p>
          </Card>

          <Card title="Tools">
            <p className="text-sm text-gray-600">Manage your tools</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
