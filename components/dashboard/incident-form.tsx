'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { CalendarIcon, Loader2, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

const formSchema = z.object({
  date: z.date({
    required_error: 'Выберите дату инцидента',
  }),
  organization: z.string().min(2, {
    message: 'Введите название организации',
  }),
  incident_type: z.string({
    required_error: 'Выберите тип инцидента',
  }),
  severity: z.string({
    required_error: 'Выберите степень тяжести',
  }),
  description: z.string().min(10, {
    message: 'Описание должно быть не менее 10 символов',
  }),
  location: z.string().min(2, {
    message: 'Введите местоположение',
  }),
  injuries: z.coerce.number().min(0).default(0),
  fatalities: z.coerce.number().min(0).default(0),
  economic_loss: z.coerce.number().min(0).default(0),
})

export function IncidentForm({ onIncidentAdded }: { onIncidentAdded?: () => void }) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization: '',
      incident_type: '',
      severity: '',
      description: '',
      location: '',
      injuries: 0,
      fatalities: 0,
      economic_loss: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          date: format(values.date, 'yyyy-MM-dd'),
        }),
      })

      if (!response.ok) {
        throw new Error('Ошибка при сохранении')
      }

      toast.success('Инцидент успешно добавлен')
      form.reset()
      setOpen(false)
      if (onIncidentAdded) onIncidentAdded()
    } catch (error) {
      console.error(error)
      toast.error('Не удалось добавить инцидент')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8">
          <Plus className="h-3.5 w-3.5" />
          Добавить инцидент
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Регистрация инцидента</DialogTitle>
          <DialogDescription>
            Заполните форму для внесения данных о новом происшествии в систему.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Дата</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal h-9",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: ru })
                            ) : (
                              <span>Выберите дату</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          locale={ru}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тяжесть</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Выберите" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Низкая</SelectItem>
                        <SelectItem value="medium">Средняя</SelectItem>
                        <SelectItem value="high">Высокая</SelectItem>
                        <SelectItem value="critical">Критическая</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Организация</FormLabel>
                  <FormControl>
                    <Input placeholder="Название компании" {...field} className="h-9" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="incident_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Тип инцидента</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Выберите тип" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Травма">Травма</SelectItem>
                        <SelectItem value="ДТП">ДТП</SelectItem>
                        <SelectItem value="Пожар">Пожар</SelectItem>
                        <SelectItem value="Разлив">Разлив</SelectItem>
                        <SelectItem value="Оборудование">Поломка оборудования</SelectItem>
                        <SelectItem value="Другое">Другое</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Местоположение</FormLabel>
                    <FormControl>
                      <Input placeholder="Цех / Участок" {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Описание</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Краткое описание происшествия" 
                      className="resize-none min-h-[80px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="injuries"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Травмы</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fatalities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Смерти</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="economic_loss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ущерб (₸)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="h-9" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Сохранить инцидент
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
