'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinkHealthBadgeProps {
  linkId: number;
  healthStatus?: string;
  lastHealthCheck?: string | null;
  showCheckButton?: boolean;
}

export function LinkHealthBadge({ 
  linkId, 
  healthStatus, 
  lastHealthCheck,
  showCheckButton = true 
}: LinkHealthBadgeProps) {
  const [currentStatus, setCurrentStatus] = useState(healthStatus || 'unknown');
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/user/health-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ linkId }),
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentStatus(data.health.status);
      }
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setChecking(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'healthy':
        return {
          icon: CheckCircle,
          color: 'text-green-600 dark:text-green-400',
          bg: 'bg-green-100 dark:bg-green-900/30',
          label: 'Healthy',
        };
      case 'broken':
        return {
          icon: XCircle,
          color: 'text-red-600 dark:text-red-400',
          bg: 'bg-red-100 dark:bg-red-900/30',
          label: 'Broken',
        };
      case 'redirecting':
        return {
          icon: AlertCircle,
          color: 'text-yellow-600 dark:text-yellow-400',
          bg: 'bg-yellow-100 dark:bg-yellow-900/30',
          label: 'Redirecting',
        };
      case 'timeout':
        return {
          icon: Clock,
          color: 'text-orange-600 dark:text-orange-400',
          bg: 'bg-orange-100 dark:bg-orange-900/30',
          label: 'Timeout',
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-600 dark:text-gray-400',
          bg: 'bg-gray-100 dark:bg-gray-900/30',
          label: 'Unknown',
        };
    }
  };

  const config = getStatusConfig(currentStatus);
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${config.bg} ${config.color}`}>
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">{config.label}</span>
      </div>
      {showCheckButton && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCheck}
          disabled={checking}
          className="h-7 px-2"
        >
          {checking ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <span className="text-xs">Check</span>
          )}
        </Button>
      )}
      {lastHealthCheck && (
        <span className="text-xs text-gray-500 dark:text-gray-500">
          {new Date(lastHealthCheck).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
