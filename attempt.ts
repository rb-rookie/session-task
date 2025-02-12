
/*
1. Refactoring:
Modularization: Break the provided processSession function into smaller, clearly defined functions.
Each function should have a single responsibility, following basic SOLID principles.
Remove Hardcoded Values: Ensure values like SESSION
_
TIMEOUT are configurable (e.g., as a function
parameter or an environment variable).
2. Error Handling:
Implement basic error handling to manage cases such as:
Session not found.
Expired session.
Any database-related issues (e.g., failure to delete a session or add a log).
3. Simple Optimization:
Minimize Redundant Database Calls: Refactor the code to reduce the number of NoSQL database
interactions where possible. You may assume database latency is a concern, so look for small
optimizations like eliminating unnecessary writes.
*/

type Log = {
    sessionId: string,
    logTimestamp: number,
    message: string,
}

type Session = {
    sessionId: string,
    lastActivityTimestamp: number,
    isActive: boolean
}

type dbType = {
    getSession: (arg: string) => Promise<Session>,
    deleteSession: (arg: string) => Promise<void>,
    updateSession: (arg: Session) => Promise<Session>,
    addLog: (log: Log) => Promise<void>
}


async function initSession(db: dbType ,sessionId: string) {
    const session = await db.getSession(sessionId);
    if (!session) {
        throw new Error("Session not found");
    }
    return session;
}

function setupConfig() { // a good practice is to setup config per environment
    return { timeout: process.env.SESSION_TIMEOUT}
}


async function clearSession({sessionId}, db, now) {
    await db.deleteSession(sessionId);
    await db.addLog({ sessionId, logTimestamp: now, message: "Session expired" });
}
async function refreshSession(session: Session, db: dbType, now: number) {
    session.lastActivityTimestamp = now;
    await db.updateSession(session);
    const { sessionId } = session;
    await db.addLog({ sessionId, logTimestamp: now, message: "Session updated" });
}

async function handleSessions(db: dbType, sessionId: string, {timeout}) {
    const session = await initSession(db, sessionId);

    const now = Date.now();
    if (session.lastActivityTimestamp + timeout < now) {
      await clearSession(session,db,now);
    } else {
        await refreshSession(session,db,now);
    }
}