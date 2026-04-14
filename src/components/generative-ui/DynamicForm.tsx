import type React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function DynamicForm({ data, layout }: any) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsSubmitting(false)
    setSubmitted(true)

    // Reset after 3 seconds
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        {data.description && <CardDescription>{data.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {submitted ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-2">
              <div className="text-primary text-4xl">✓</div>
              <p className="text-font font-medium">Thank you for your message!</p>
              <p className="text-font/60 text-sm">We'll get back to you soon.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {data.fields?.map((field: any, i: number) => (
              <div key={i} className="space-y-2">
                <Label htmlFor={field.name} className="text-font">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    id={field.name}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="bg-background text-font border-border focus:border-primary"
                    rows={field.rows || 4}
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type || 'text'}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    defaultValue={field.defaultValue}
                    className="bg-background text-font border-border focus:border-primary"
                  />
                )}
              </div>
            ))}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Sending...' : data.submitLabel || 'Submit'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
