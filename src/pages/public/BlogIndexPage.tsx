import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { BLOG_POSTS_LIST } from './BlogPostPage';

export function BlogIndexPage() {
    useEffect(() => {
        document.title = 'בלוג · Doggo CRM — תכנים מאלפים מקצועיים';
        return () => { document.title = 'Doggo CRM — ניהול עסק האילוף שלך, בלי גיליונות אקסל'; };
    }, []);

    return (
        <div dir="rtl" className="min-h-screen bg-background text-text-primary">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <nav className="flex items-center justify-between mb-12">
                    <Link to="/" className="flex items-center gap-2">
                        <span className="text-2xl">🐾</span>
                        <span className="font-bold">Doggo CRM</span>
                    </Link>
                    <Link to="/" className="text-text-muted hover:text-primary transition-colors text-sm">← דף הבית</Link>
                </nav>

                <header className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-black mb-3">הבלוג</h1>
                    <p className="text-text-secondary text-lg">תכנים, טיפים, ופוסטים על ניהול עסק אילוף עצמאי בישראל.</p>
                </header>

                <div className="space-y-6">
                    {BLOG_POSTS_LIST.map(post => (
                        <Link
                            key={post.slug}
                            to={`/blog/${post.slug}`}
                            className="block flat-card p-6 hover:border-primary transition-colors group"
                        >
                            <div className="text-xs text-text-muted mb-2">
                                {new Date(post.publishedAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} · {post.readingMinutes} דק׳ קריאה
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {post.title}
                            </h2>
                            <p className="text-text-secondary leading-relaxed">{post.description}</p>
                        </Link>
                    ))}
                </div>

                <footer className="mt-16 pt-8 border-t border-border flex items-center justify-between text-sm text-text-muted">
                    <Link to="/" className="hover:text-primary transition-colors">← דף הבית</Link>
                    <Link to="/pricing" className="hover:text-primary transition-colors">מחירים</Link>
                </footer>
            </div>
        </div>
    );
}
