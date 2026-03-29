'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
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
    <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
      <Select
        value={filters.organization}
        onValueChange={(value) => onFilterChange('organization', value)}
      >
        <SelectTrigger className="h-8 w-full border-border bg-background text-xs font-medium transition-colors hover:bg-muted/50 sm:w-45">
          <SelectValue placeholder="Организация" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">Все организации</SelectItem>
          {organizations.map((org) => (
            <SelectItem key={org} value={org} className="text-xs">
              {org}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.incidentType}
        onValueChange={(value) => onFilterChange('incidentType', value)}
      >
        <SelectTrigger className="h-8 w-full border-border bg-background text-xs font-medium transition-colors hover:bg-muted/50 sm:w-40">
          <SelectValue placeholder="Тип инцидента" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">Все типы</SelectItem>
          {incidentTypes.map((type) => (
            <SelectItem key={type} value={type} className="text-xs">
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 w-full justify-start border-border bg-background text-left text-xs font-medium transition-colors hover:bg-muted/50 sm:w-40',
              !filters.startDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {filters.startDate ? format(filters.startDate, 'd MMM, yyyy', { locale: ru }) : 'Дата начала'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.startDate}
            onSelect={(date) => onFilterChange('startDate', date)}
            initialFocus
            locale={ru}
          />
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              'h-8 w-full justify-start border-border bg-background text-left text-xs font-medium transition-colors hover:bg-muted/50 sm:w-40',
              !filters.endDate && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {filters.endDate ? format(filters.endDate, 'd MMM, yyyy', { locale: ru }) : 'Дата конца'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={filters.endDate}
            onSelect={(date) => onFilterChange('endDate', date)}
            initialFocus
            locale={ru}
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        className="h-8 w-full border-border bg-background transition-colors hover:bg-muted/50 sm:w-8"
      >
        <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
      </Button>
    </div>
  )
}
