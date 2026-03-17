'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, Filter, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface FiltersProps {
  filters: {
    organization: string
    incidentType: string
    startDate: Date | undefined
    endDate: Date | undefined
  }
  onFilterChange: (key: string, value: string | Date | undefined) => void
  onRefresh: () => void
  organizations: string[]
  incidentTypes: string[]
  isLoading: boolean
}

export function Filters({
  filters,
  onFilterChange,
  onRefresh,
  organizations,
  incidentTypes,
  isLoading,
}: FiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="h-4 w-4" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <Select
        value={filters.organization}
        onValueChange={(value) => onFilterChange('organization', value)}
      >
        <SelectTrigger className="w-[180px] border-border/50 bg-secondary/50">
          <SelectValue placeholder="Organization" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Organizations</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org} value={org}>
              {org}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.incidentType}
        onValueChange={(value) => onFilterChange('incidentType', value)}
      >
        <SelectTrigger className="w-[160px] border-border/50 bg-secondary/50">
          <SelectValue placeholder="Incident Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {incidentTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[140px] justify-start border-border/50 bg-secondary/50 text-left font-normal',
              !filters.startDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.startDate ? format(filters.startDate, 'MMM d, yyyy') : 'Start Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.startDate}
            onSelect={(date) => onFilterChange('startDate', date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-[140px] justify-start border-border/50 bg-secondary/50 text-left font-normal',
              !filters.endDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {filters.endDate ? format(filters.endDate, 'MMM d, yyyy') : 'End Date'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.endDate}
            onSelect={(date) => onFilterChange('endDate', date)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        className="border-border/50 bg-secondary/50"
      >
        <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
      </Button>
    </div>
  )
}
