import React from 'react';

interface State { error: Error | null }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('App ErrorBoundary caught render error:', error, info.componentStack);
    }

    handleReload = () => {
        this.setState({ error: null });
        window.location.assign('/');
    };

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-6" dir="rtl">
                <div className="flat-card max-w-md w-full p-8 text-center space-y-4">
                    <div className="text-4xl">🐾</div>
                    <h1 className="text-xl font-bold text-text-primary">משהו השתבש</h1>
                    <p className="text-sm text-text-muted">
                        המערכת נתקלה בשגיאה בטעינת הדף. ניסיון נוסף בדרך כלל פותר את זה.
                    </p>
                    <button onClick={this.handleReload} className="btn btn-primary">
                        חזרה לדף הבית
                    </button>
                </div>
            </div>
        );
    }
}
