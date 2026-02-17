import { useState } from 'react';
import { Tag, Clock, Trash2, Plus } from 'lucide-react';
import { useServices } from '../../hooks/useServices';

export function ServicesSettings() {
    const { services, addService, deleteService, loading: servicesLoading } = useServices();
    const [isAddingService, setIsAddingService] = useState(false);
    const [newService, setNewService] = useState({ name: '', price: '', duration: '60' });

    const handleAddService = async () => {
        if (!newService.name || !newService.price) return;
        try {
            await addService({
                name: newService.name,
                price: parseFloat(newService.price),
                duration_minutes: parseInt(newService.duration),
                currency: 'ILS'
            });
            setIsAddingService(false);
            setNewService({ name: '', price: '', duration: '60' });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="flat-card p-6 md:p-8 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2 text-text-primary">
                    <Tag className="text-primary" />
                    שירותים ומחיר
                </h2>
                {!isAddingService && (
                    <button
                        onClick={() => setIsAddingService(true)}
                        className="btn btn-primary text-sm flex items-center gap-2"
                    >
                        <Plus size={16} />
                        הוסף שירות
                    </button>
                )}
            </div>

            <div className="space-y-3">
                {servicesLoading ? (
                    <p className="text-sm text-text-muted">טוען שירותים...</p>
                ) : services.length === 0 && !isAddingService ? (
                    <p className="text-sm text-text-muted italic">אין שירותים מוגדרים עדיין. הוסף את השירות הראשון שלך!</p>
                ) : (
                    services.map(service => (
                        <div key={service.id} className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary transition-all bg-surface group">
                            <div>
                                <h3 className="font-bold text-text-primary">{service.name}</h3>
                                <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
                                    <span className="flex items-center gap-1">
                                        <Clock size={12} />
                                        {service.duration_minutes} דק׳
                                    </span>
                                    <span>•</span>
                                    <span className="font-mono ltr-nums">
                                        ₪{service.price}
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => deleteService(service.id)}
                                className="p-2 text-error/60 hover:text-error hover:bg-error/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                title="מחק שירות"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))
                )}

                {isAddingService && (
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5 animate-fade-in">
                        <h3 className="font-bold text-sm mb-3 text-primary">הוספת שירות חדש</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                            <input
                                type="text" placeholder="שם השירות (למשל: אימון אישי)"
                                className="input-field text-sm"
                                value={newService.name}
                                autoFocus
                                onChange={e => setNewService({ ...newService, name: e.target.value })}
                            />
                            <div className="relative">
                                <span className="absolute start-3 top-2.5 text-text-muted text-xs">₪</span>
                                <input
                                    type="number" placeholder="מחיר"
                                    className="input-field text-sm ps-8"
                                    value={newService.price}
                                    onChange={e => setNewService({ ...newService, price: e.target.value })}
                                />
                            </div>
                            <div className="relative">
                                <span className="absolute start-3 top-2.5 text-text-muted text-xs">דק׳</span>
                                <input
                                    type="number" placeholder="משך"
                                    className="input-field text-sm ps-8"
                                    value={newService.duration}
                                    onChange={e => setNewService({ ...newService, duration: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setIsAddingService(false)}
                                className="btn btn-secondary text-xs"
                            >
                                ביטול
                            </button>
                            <button
                                onClick={handleAddService}
                                disabled={!newService.name || !newService.price}
                                className="btn btn-primary text-xs"
                            >
                                שמור שירות
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
