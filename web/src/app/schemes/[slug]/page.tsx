import { SchemeDetailScreen } from '@/modules/schemes'

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function SchemePage({ params }: PageProps) {
  const { slug } = await params
  return <SchemeDetailScreen slug={slug} />
}
