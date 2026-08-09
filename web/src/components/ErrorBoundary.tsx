import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  children: ReactNode
  /** Optional label shown in the error card for context (e.g. section name). */
  sectionLabel?: string
}

interface State {
  error: Error | null
}

/**
 * Class-based error boundary — React 19 still requires a class component here
 * because there is no hooks equivalent. Catches rendering and lifecycle errors
 * in its subtree and shows a recovery UI instead of a white screen.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      const label = this.props.sectionLabel ?? 'this section'
      return (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" aria-hidden="true" />
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {label} encountered an unexpected error and couldn't render.
            </p>
            <pre className="text-xs bg-muted/50 p-3 rounded-md overflow-x-auto">
              {this.state.error.message}
            </pre>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
