import { createContext, useContext, useState, type ReactNode } from 'react';

interface QA {
    question: string;
    answer: string;
}

interface AdvisorContextType {
    qa: QA[];
    addQA: (qa: QA) => void;
}

const AdvisorContext = createContext<AdvisorContextType | null>(null);

export function AdvisorProvider({ children }: { children: ReactNode }) {
    const [qa, setQA] = useState<QA[]>([]);

    const addQA = (item: QA) => setQA(prev => [...prev, item]);

    return (
        <AdvisorContext.Provider value={{ qa, addQA }}>
            {children}
        </AdvisorContext.Provider>
    );
}

export function useAdvisor() {
    const ctx = useContext(AdvisorContext);
    if (!ctx) throw new Error('useAdvisor must be used within AdvisorProvider');
    return ctx;
}