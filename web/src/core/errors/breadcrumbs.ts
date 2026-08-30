export interface Breadcrumb {
  timestamp: string
  category: 'navigation' | 'ui' | 'network' | 'auth'
  message: string
  data?: Record<string, unknown>
}

class BreadcrumbsBuffer {
  private buffer: Breadcrumb[] = []
  private readonly maxSize: number

  constructor(maxSize = 50) {
    this.maxSize = maxSize
  }

  add(category: Breadcrumb['category'], message: string, data?: Record<string, unknown>) {
    const crumb: Breadcrumb = {
      timestamp: new Date().toISOString(),
      category,
      message,
      data,
    }
    this.buffer.push(crumb)
    if (this.buffer.length > this.maxSize) {
      this.buffer.shift()
    }
  }

  getSnapshot(): Breadcrumb[] {
    return [...this.buffer]
  }

  clear() {
    this.buffer = []
  }
}

export const breadcrumbs = new BreadcrumbsBuffer()
