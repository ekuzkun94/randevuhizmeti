import { ReactNode } from 'react'
import { Button } from './Button'
import { Badge } from './Badge'
import { StatsCard } from './StatsCard'
import { Sparkles, ArrowRight } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: ReactNode
  gradient?: string
  stats?: Array<{
    title: string
    value: string | number
    change?: {
      value: number
      type: 'increase' | 'decrease' | 'neutral'
      period?: string
    }
    icon?: ReactNode
    gradient?: string
    trend?: {
      data: number[]
      period: string
    }
  }>
  actions?: ReactNode
  breadcrumbs?: Array<{
    label: string
    href?: string
  }>
  badge?: {
    text: string
    variant?: 'default' | 'secondary' | 'destructive' | 'outline'
    color?: string
  }
}

export function PageHeader({
  title,
  description,
  icon,
  gradient = 'from-blue-500 to-orange-500',
  stats,
  actions,
  breadcrumbs,
  badge,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center">
              {index > 0 && <ArrowRight className="h-4 w-4 mx-2" />}
              {crumb.href ? (
                <a href={crumb.href} className="hover:text-gray-700 transition-colors">
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-700 font-medium">{crumb.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Main Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-transparent"></div>
        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                {icon && (
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-orange-500 rounded-xl shadow-lg">
                    <div className="text-white">
                      {icon}
                    </div>
                  </div>
                )}
                <div>
                  <h1 className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent flex items-center space-x-3`}>
                    <span>{title}</span>
                    {badge && (
                      <Badge 
                        variant={badge.variant} 
                        className={`${badge.color} text-white border-0 shadow-sm`}
                      >
                        {badge.text}
                      </Badge>
                    )}
                  </h1>
                  {description && (
                    <p className="text-gray-600 text-lg mt-2 max-w-2xl">
                      {description}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {actions && (
              <div className="flex items-center space-x-3">
                {actions}
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-orange-400/20 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-400/20 to-orange-400/20 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatsCard
              key={index}
              title={stat.title}
              value={stat.value}
              change={stat.change}
              icon={stat.icon}
              gradient={stat.gradient}
              trend={stat.trend}
            />
          ))}
        </div>
      )}
    </div>
  )
} 