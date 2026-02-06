import { FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function TermsOfServicePage() {
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
                        <FileText size={24} className="text-green-600" />
                        <span className="font-bold text-slate-800">{appName}</span>
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-4xl mx-auto px-6 py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-12">
                    <h1 className="text-4xl font-black text-slate-800 mb-2">Terms of Service</h1>
                    <p className="text-slate-500 mb-8">Last updated: {lastUpdated}</p>

                    <div className="prose prose-slate max-w-none">
                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">1. Acceptance of Terms</h2>
                            <p className="text-slate-600 leading-relaxed">
                                By accessing or using {appName} ("the Service"), you agree to be bound by these Terms of Service.
                                If you do not agree to these terms, please do not use our Service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">2. Description of Service</h2>
                            <p className="text-slate-600 leading-relaxed">
                                {appName} is a client relationship management platform designed for professional dog trainers.
                                The Service allows you to manage clients, schedule training sessions, track programs,
                                and communicate with your clients.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">3. User Accounts</h2>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">3.1 Registration</h3>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                To use the Service, you must sign in using your Google account. You are responsible for
                                maintaining the security of your Google account credentials.
                            </p>

                            <h3 className="text-lg font-semibold text-slate-700 mb-2">3.2 Account Responsibilities</h3>
                            <ul className="list-disc list-inside text-slate-600 space-y-2">
                                <li>You must provide accurate information when using the Service</li>
                                <li>You are responsible for all activity under your account</li>
                                <li>You must notify us immediately of any unauthorized access</li>
                                <li>You must be at least 18 years old to use this Service</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">4. Acceptable Use</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">You agree not to:</p>
                            <ul className="list-disc list-inside text-slate-600 space-y-2">
                                <li>Use the Service for any illegal purpose</li>
                                <li>Upload malicious code, viruses, or harmful content</li>
                                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                                <li>Interfere with or disrupt the Service</li>
                                <li>Violate any applicable laws or regulations</li>
                                <li>Harass, abuse, or harm others through the Service</li>
                                <li>Use the Service to send spam or unsolicited communications</li>
                            </ul>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">5. Your Data</h2>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">5.1 Ownership</h3>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                You retain ownership of all data you enter into the Service, including client information,
                                training records, and notes. We do not claim ownership of your content.
                            </p>

                            <h3 className="text-lg font-semibold text-slate-700 mb-2">5.2 License to Use</h3>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                By using the Service, you grant us a limited license to store, process, and display your
                                data solely for the purpose of providing the Service to you.
                            </p>

                            <h3 className="text-lg font-semibold text-slate-700 mb-2">5.3 Data Protection</h3>
                            <p className="text-slate-600 leading-relaxed">
                                We handle your data in accordance with our{' '}
                                <Link to="/privacy" className="text-green-600 hover:underline">Privacy Policy</Link>.
                                You are responsible for ensuring you have appropriate consent from your clients
                                to store their information in the Service.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">6. Third-Party Services</h2>
                            <p className="text-slate-600 leading-relaxed">
                                The Service integrates with Google services (Gmail, Calendar) with your explicit consent.
                                Your use of these integrations is subject to Google's Terms of Service.
                                We are not responsible for the availability or functionality of third-party services.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">7. Service Availability</h2>
                            <p className="text-slate-600 leading-relaxed">
                                We strive to maintain high availability of the Service, but we do not guarantee
                                uninterrupted access. We may temporarily suspend the Service for maintenance,
                                updates, or due to circumstances beyond our control.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">8. Intellectual Property</h2>
                            <p className="text-slate-600 leading-relaxed">
                                The Service, including its design, features, and code, is owned by {companyName}.
                                You may not copy, modify, distribute, or reverse engineer any part of the Service
                                without our written permission.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">9. Limitation of Liability</h2>
                            <p className="text-slate-600 leading-relaxed p-4 bg-amber-50 rounded-lg border border-amber-200">
                                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                                TO THE MAXIMUM EXTENT PERMITTED BY LAW, {companyName.toUpperCase()} SHALL NOT BE LIABLE FOR
                                ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR
                                USE OF THE SERVICE.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">10. Indemnification</h2>
                            <p className="text-slate-600 leading-relaxed">
                                You agree to indemnify and hold harmless {companyName} from any claims, damages,
                                or expenses arising from your use of the Service, your violation of these Terms,
                                or your violation of any rights of another party.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">11. Termination</h2>
                            <p className="text-slate-600 leading-relaxed mb-4">
                                We may suspend or terminate your access to the Service at any time, with or without cause.
                                You may also delete your account at any time.
                            </p>
                            <p className="text-slate-600 leading-relaxed">
                                Upon termination, your right to use the Service will immediately cease.
                                You may request an export of your data before account deletion.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">12. Changes to Terms</h2>
                            <p className="text-slate-600 leading-relaxed">
                                We may modify these Terms at any time. We will notify you of significant changes
                                by posting the updated Terms on this page. Your continued use of the Service
                                after changes constitutes acceptance of the modified Terms.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">13. Governing Law</h2>
                            <p className="text-slate-600 leading-relaxed">
                                These Terms shall be governed by the laws of Israel, without regard to its
                                conflict of law principles. Any disputes shall be resolved in the courts of Israel.
                            </p>
                        </section>

                        <section className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-800 mb-4">14. Contact Information</h2>
                            <p className="text-slate-600 leading-relaxed">
                                For questions about these Terms, please contact us at:
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
                    <Link to="/privacy" className="text-green-600 hover:text-green-700 font-medium hover:underline">
                        View Privacy Policy →
                    </Link>
                </div>
            </main>
        </div>
    );
}
