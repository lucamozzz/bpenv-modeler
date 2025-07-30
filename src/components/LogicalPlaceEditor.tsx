import { useState } from 'react';
import { useEnvStore } from '../envStore';
import { LogicalPlace } from '../envTypes';

const LogicalPlaceEditor = ({
    initialPlace,
    onSave,
}: {
    initialPlace?: LogicalPlace;
    onSave?: () => void;
}) => {
    const [newLPName, setNewLPName] = useState(initialPlace?.name ?? '');
    const [newLPConditions, setNewLPConditions] = useState(initialPlace?.conditions ?? [
        { attribute: '', operator: '==', value: '' },
    ]);

    const logicalPlaces = useEnvStore((state) => state.logicalPlaces);
    const addLogicalPlace = useEnvStore((state) => state.addLogicalPlace);
    const updateLogicalPlace = useEnvStore((state) => state.updateLogicalPlace);

    const handleSaveLogicalPlace = () => {
        const id = initialPlace?.id ?? 'lp_' + Math.random().toString(36).substring(2, 8);
        const updatedLP: LogicalPlace = {
            id,
            name: newLPName,
            conditions: newLPConditions,
            operator: 'AND',
            attributes: {},
        };

        if (initialPlace) {
            updateLogicalPlace(id, updatedLP);
        } else {
            addLogicalPlace(updatedLP);
        }

        setNewLPName('');
        setNewLPConditions([{ attribute: '', operator: '==', value: '' }]);
        onSave?.();
    };

    const addConditionField = () => setNewLPConditions([...newLPConditions, { attribute: '', operator: '==', value: '' }]);
    const removeConditionField = (index: number) => {
        const updated = newLPConditions.filter((_, i) => i !== index);
        setNewLPConditions(updated);
    };

    return (
        <div>
            <div className="mb-2">
                <input
                    className="form-control"
                    placeholder="Logical Place Name"
                    value={newLPName}
                    onChange={(e) => setNewLPName(e.target.value)}
                />
            </div>

            <div className="mb-2">
                <label className="form-label">Conditions</label>
                {newLPConditions.map((cond, i) => (
                    <div key={i} className="d-flex align-items-center gap-2 mb-2">
                        <select
                            className="form-select"
                            style={{ width: '35%' }}
                            value={cond.attribute || ''}
                            onChange={(e) => {
                                const updated = [...newLPConditions];
                                updated[i] = { ...updated[i], attribute: e.target.value };
                                setNewLPConditions(updated);
                            }}
                        >
                            <option value="">Select attribute</option>
                            {[
                                ...new Set(useEnvStore.getState().places.flatMap(p => Object.keys(p.attributes)))
                            ].map(attr => (
                                <option key={attr} value={attr}>{attr}</option>
                            ))}
                        </select>

                        <select
                            className="form-select"
                            style={{ width: '20%' }}
                            value={cond.operator || '=='}
                            onChange={(e) => {
                                const updated = [...newLPConditions];
                                updated[i] = { ...updated[i], operator: e.target.value };
                                setNewLPConditions(updated);
                            }}
                        >
                            <option value="==">==</option>
                            <option value="!=">!=</option>
                            <option value="<">&lt;</option>
                            <option value=">">&gt;</option>
                        </select>

                        <input
                            className="form-control"
                            style={{ width: '35%' }}
                            placeholder="Value"
                            value={cond.value || ''}
                            onChange={(e) => {
                                const updated = [...newLPConditions];
                                updated[i] = { ...updated[i], value: e.target.value };
                                setNewLPConditions(updated);
                            }}
                        />

                        <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => removeConditionField(i)}
                        >
                            -
                        </button>
                    </div>
                ))}
                <button className="btn btn-sm btn-outline-success w-100 mt-2" onClick={addConditionField}>
                    Add Condition
                </button>
            </div>
            <button
                className="btn btn-sm btn-outline-light w-100 mt-2"
                onClick={handleSaveLogicalPlace}
                disabled={
                    !newLPName.trim() ||
                    logicalPlaces.some(lp => lp.name === newLPName && lp.id !== initialPlace?.id) ||
                    newLPConditions.some(cond => !cond.attribute || !cond.value)
                }>
                {initialPlace ? 'Update Logical Place' : 'Save Logical Place'}
            </button>
        </div>
    );
};

export default LogicalPlaceEditor;