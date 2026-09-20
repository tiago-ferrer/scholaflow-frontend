export interface StorageCost {
  username: string
  storage_size_bytes: number
  storage_size_formatted: string
  estimated_monthly_cost_usd: number
}

export interface ResourceUsage {
  quantity: number
  unit: string
  estimated_cost_usd: number
}

export interface UsageCost {
  username: string
  by_resource: Record<string, ResourceUsage>
  total_estimated_cost_usd: number
}
