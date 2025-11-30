import React from 'react';
import { Container, Row, Col, Card, Button, Alert } from 'react-bootstrap';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
    
    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-vh-100 d-flex align-items-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Container>
            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <Card className="border-0 shadow-lg">
                  <Card.Body className="p-5 text-center">
                    <div className="mb-4">
                      <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                           style={{ width: '80px', height: '80px' }}>
                        <i className="fas fa-exclamation-triangle text-danger" style={{ fontSize: '2rem' }}></i>
                      </div>
                      <h3 className="fw-bold mb-2 text-danger">Something went wrong</h3>
                      <p className="text-muted">We're sorry, but something unexpected happened.</p>
                    </div>

                    <Alert variant="warning" className="text-start mb-4">
                      <h6>Error Details:</h6>
                      <p className="mb-2">
                        <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
                      </p>
                      {this.state.errorInfo?.componentStack && (
                        <details className="small">
                          <summary>Component Stack</summary>
                          <pre className="mt-2 small text-muted" style={{ whiteSpace: 'pre-wrap' }}>
                            {this.state.errorInfo.componentStack}
                          </pre>
                        </details>
                      )}
                    </Alert>

                    <div className="d-flex gap-3 justify-content-center">
                      <Button 
                        variant="primary" 
                        onClick={this.handleReload}
                        className="px-4"
                      >
                        <i className="fas fa-redo me-2"></i>
                        Reload Page
                      </Button>
                      <Button 
                        variant="outline-secondary" 
                        onClick={this.handleGoHome}
                        className="px-4"
                      >
                        <i className="fas fa-home me-2"></i>
                        Go to Home
                      </Button>
                    </div>

                    <div className="mt-4">
                      <p className="text-muted small mb-2">
                        If this problem persists, please contact support.
                      </p>
                      <Button 
                        variant="link" 
                        size="sm"
                        onClick={() => {
                          const errorReport = {
                            error: this.state.error?.message,
                            stack: this.state.error?.stack,
                            componentStack: this.state.errorInfo?.componentStack,
                            timestamp: new Date().toISOString(),
                            userAgent: navigator.userAgent,
                            url: window.location.href
                          };
                          
                          // Copy error report to clipboard
                          navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
                            .then(() => alert('Error report copied to clipboard'))
                            .catch(() => console.log('Error report:', errorReport));
                        }}
                      >
                        <i className="fas fa-copy me-2"></i>
                        Copy Error Report
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </Container>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;


























