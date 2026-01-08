import { isAdmin, isTalent } from './rbac';

describe('RBAC Utils', () => {
    it('should identify admin correctly', () => {
        const sessionArg = { user: { role: 'ADMIN' } } as any;
        expect(isAdmin(sessionArg)).toBe(true);
        expect(isTalent(sessionArg)).toBe(false);
    });

    it('should identify talent correctly', () => {
        const sessionArg = { user: { role: 'TALENT' } } as any;
        expect(isAdmin(sessionArg)).toBe(false);
        expect(isTalent(sessionArg)).toBe(true);
    });

    it('should handle null session', () => {
        expect(isAdmin(null)).toBe(false);
        expect(isTalent(null)).toBe(false);
    });
});
