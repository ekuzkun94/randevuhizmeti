import { ReactNode } from 'react'
import { Card, CardContent } from './Card'
import { Badge } from './Badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease' | 'neutral'
    period?: string
  }
  icon?: ReactNode
  gradient?: string
  bgColor?: string
  iconBg?: string
  iconColor?: string
  href?: string
  onClick?: () => void
  className?: string
  loading?: boolean
  trend?: {
    data: number[]
    period: string
  }
}

export function StatsCard({
  title,
  value,
  change,
  icon,
  gradient = 'from-blue-500 to-orange-500',
  bgColor = 'bg-white',
  iconBg = 'bg-gradient-to-br from-blue-500 to-orange-500',
  iconColor = 'text-white',
  href,
  onClick,
  className = '',
  loading = false,
  trend
}: StatsCardProps) {
  const getChangeIcon = () => {
    if (!change) return null
    
    switch (change.type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'neutral':
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const getChangeColor = () => {
    if (!change) return ''
    
    switch (change.type) {
      case 'increase':
        return 'text-green-600'
      case 'decrease':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-600'
      default:
        return 'text-gray-600'
    }
  }

  const getChangeBg = () => {
    if (!change) return ''
    
    switch (change.type) {
      case 'increase':
        return 'bg-green-50'
      case 'decrease':
        return 'bg-red-50'
      case 'neutral':
        return 'bg-gray-50'
      default:
        return 'bg-gray-50'
    }
  }

  const CardWrapper = href ? 'a' : onClick ? 'button' : 'div'
  const cardProps = href ? { href } : onClick ? { onClick } : {}

  return (
    <CardWrapper
      {...cardProps}
      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
        (href || onClick) ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <Card className={`border-0 shadow-lg ${bgColor} h-full`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              
              {loading ? (
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ) : (
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              )}
              
              {change && (
                <div className={`flex items-center space-x-2 px-2 py-1 rounded-full ${getChangeBg()} w-fit`}>
                  {getChangeIcon()}
                  <span className={`text-sm font-medium ${getChangeColor()}`}>
                    {change.value > 0 ? '+' : ''}{change.value}%
                  </span>
                  {change.period && (
                    <span className="text-xs text-gray-500">{change.period}</span>
                  )}
                </div>
              )}
            </div>
            
            {icon && (
              <div className={`p-4 rounded-xl shadow-lg ${iconBg} ${iconColor} ml-4`}>
                <div className="w-8 h-8 flex items-center justify-center">
                  {icon}
                </div>
              </div>
            )}
          </div>

          {/* Trend Chart */}
          {trend && trend.data && trend.data.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-end justify-between h-12 space-x-1">
                {trend.data.map((point, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-orange-500 rounded-t"
                    style={{
                      height: `${Math.max(10, (point / Math.max(...trend.data)) * 100)}%`
                    }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{trend.period}</p>
            </div>
          )}
        </CardContent>
        
        {/* Hover Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/10 to-orange-400/10 rounded-full -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-pink-400/10 to-orange-400/10 rounded-full translate-y-8 -translate-x-8" />
      </Card>
    </CardWrapper>
  )
}

// Preset gradient combinations
export const gradientPresets = {
  blue: 'from-blue-500 to-blue-600',
  orange: 'from-orange-500 to-orange-600',
  blueOrange: 'from-blue-500 to-orange-500',
  orangeBlue: 'from-orange-500 to-blue-500',
  lightBlue: 'from-blue-400 to-blue-500',
  lightOrange: 'from-orange-400 to-orange-500',
  darkBlue: 'from-blue-600 to-blue-700',
  darkOrange: 'from-orange-600 to-orange-700',
  success: 'from-blue-500 to-blue-600',
  warning: 'from-orange-500 to-orange-600',
  danger: 'from-red-500 to-red-600',
  info: 'from-blue-400 to-blue-500',
  primary: 'from-blue-500 to-orange-500',
  secondary: 'from-orange-400 to-blue-400',
  accent: 'from-blue-500 to-orange-400',
  muted: 'from-gray-400 to-gray-500',
  card: 'from-white to-gray-50',
  border: 'from-blue-200 to-orange-200',
  input: 'from-white to-gray-50',
  background: 'from-blue-50 to-orange-50',
  foreground: 'from-gray-900 to-gray-800',
  destructive: 'from-red-500 to-red-600',
  ring: 'from-blue-500 to-orange-500',
  chart1: 'from-blue-500 to-blue-600',
  chart2: 'from-orange-500 to-orange-600',
  chart3: 'from-blue-400 to-orange-400',
  chart4: 'from-orange-400 to-blue-400',
  chart5: 'from-blue-300 to-orange-300',
} as const 