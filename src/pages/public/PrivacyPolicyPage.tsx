import { Shield, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function PrivacyPolicyPage() {
    const lastUpdated = 'February 6, 2026';
    const contactEmail = 'yakirgeffen@gmail.com';
    const appName = 'DogGo CRM';
    const companyName = 'DogGo';
    const websiteUrl = 'https://doggo-crm-test.vercel.app';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors">
                        <ArrowRight size={20} className="rotate-180" />
                        <span className="font-medium">Back to App</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <Shield size={24} className="text-green-600" />
                        <span className="font-bold text-slate-800">{appName}</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
                    <h1 className="text-4xl font-black text-slate-800 mb-2">Privacy Policy</h1>
                    <p className="text-slate-500 mb-8">Last updated: {lastUpdated}</p>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Introduction</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Welcome to {appName}. We respect your privacy and are committed to protecting your personal data.
                                This privacy policy explains how we collect, use, and safeguard your information when you use our
                                dog training management platform.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Information We Collect</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">We collect the following types of information:</p>

                            <h3 className="text-lg font-semibold text-slate-700 mb-2">2.1 Account Information</h3>
                            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
                                <li>Name and email address (via Google Sign-In)</li>
                                <li>Profile picture (from your Google account)</li>
                                <li>Authentication tokens for accessing the service</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-slate-700 mb-2">2.2 Business Data</h3>
                            <ul className="list-disc list-inside text-slate-600 space-y-2 mb-4">
                                <li>Client information you enter (names, contact details, dog information)</li>
                                <li>Training programs and session records</li>
                                <li>Notes and behavioral assessments</li>
                                <li>Scheduling and calendar data</li>
                            </ul>

                            <h3 className="text-lg font-semibold text-slate-700 mb-2">2.3 Google API Data</h3>
                            <p className="text-slate-600 leading-relaxed">
                                With your explicit consent, we may access limited Google services to enhance functionality:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 space-y-2 mt-2">
                                <li><strong>Gmail (send-only):</strong> To send session reminders to your clients on your behalf</li>
                                <li><strong>Calendar (read-only):</strong> To check your availability when scheduling sessions</li>
                            </ul>
                            <p className="text-slate-600 leading-relaxed mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <strong>Important:</strong> We never read, store, or access your email content.
                                We only use Gmail's send capability to deliver reminders you authorize.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. How We Use Your Information</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">We use your information to:</p>
                            <ul className="list-disc list-inside text-slate-600 space-y-2">
                                <li>Provide and maintain our dog training management service</li>
                                <li>Authenticate your identity and secure your account</li>
                                <li>Send session reminders to your clients (with your authorization)</li>
                                <li>Display your calendar availability for scheduling</li>
                                <li>Improve our service and user experience</li>
                                <li>Communicate important updates about the service</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Data Storage & Security</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                Your data is stored securely using industry-standard practices:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 space-y-2">
                                <li>Data is stored in Supabase, a secure cloud database platform</li>
                                <li>All data transmission is encrypted using TLS/SSL</li>
                                <li>Row Level Security (RLS) ensures you can only access your own data</li>
                                <li>Authentication is handled securely through Google OAuth 2.0</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Data Sharing</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We do <strong>not</strong> sell, rent, or share your personal data with third parties, except:
                            </p>
                            <ul className="list-disc list-inside text-slate-600 space-y-2">
                                <li>With your explicit consent</li>
                                <li>To comply with legal obligations</li>
                                <li>To protect our rights or the safety of users</li>
                                <li>With service providers who help operate our platform (under strict data protection agreements)</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Your Rights</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">You have the right to:</p>
                            <ul className="list-disc list-inside text-slate-600 space-y-2">
                                <li><strong>Access:</strong> Request a copy of your personal data</li>
                                <li><strong>Correction:</strong> Update or correct inaccurate data</li>
                                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                                <li><strong>Revoke Access:</strong> Disconnect Google permissions at any time via your Google Account settings</li>
                                <li><strong>Export:</strong> Request an export of your data in a portable format</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Cookies & Tracking</h2>
                            <p className="text-slate-600 leading-relaxed">
                                We use essential cookies only for authentication and session management.
                                We do not use tracking cookies, analytics cookies, or advertising cookies.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Children's Privacy</h2>
                            <p className="text-slate-600 leading-relaxed">
                                Our service is intended for professional dog trainers and is not directed at children under 13.
                                We do not knowingly collect personal information from children.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Changes to This Policy</h2>
                            <p className="text-slate-600 leading-relaxed">
                                We may update this privacy policy from time to time. We will notify you of any significant
                                changes by posting the new policy on this page and updating the "Last updated" date.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Contact Us</h2>
                            <p className="text-slate-600 leading-relaxed">
                                If you have questions about this privacy policy or wish to exercise your data rights,
                                please contact us at:
                            </p>
                            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                                <p className="text-slate-700">
                                    <strong>{companyName}</strong><br />
                                    Email: <a href={`mailto:${contactEmail}`} className="text-green-600 hover:underline">{contactEmail}</a><br />
                                    Website: <a href={websiteUrl} className="text-green-600 hover:underline">{websiteUrl}</a>
                                </p>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Footer Links */}
                <div className="mt-8 text-center">
                    <Link to="/terms" className="text-green-600 hover:text-green-700 font-medium hover:underline">
                        View Terms of Service →
                    </Link>
                </div>
            </main>
        </div>
    );
}
