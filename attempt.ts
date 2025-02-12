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


// logger function
async function logResult(db: dbType, { sessionId, logTimestamp, message }: Log) {
    try {
        await db.addLog({ sessionId, logTimestamp, message });
    } catch (error) {
        throw new Error(`Failed to write Log: ${message}`);
    }
}

// app config (ideally config per environment)
function setupConfig() {
    return {
        timeout: Number(process.env.SESSION_TIMEOUT) || 86400,// 24hours default
    }
}

// initialise session
async function initSession(db: dbType, sessionId: string) {
    try {
        return await db.getSession(sessionId);
    } catch (error) {
        throw new Error(`Failed to retrieve session due to: ${error}`);
    }
}

async function clearSession({ sessionId }, db: dbType, timestamp: number) {
    try {
        await db.deleteSession(sessionId);
        await logResult(db, { sessionId, logTimestamp: timestamp, message: "Session expired" })
    } catch (error) {
        throw new Error(`Failed to clear session due to: ${error}`);
    }
}

async function refreshSession(session: Session, db: dbType, timestamp: number) {
    try {
        session.lastActivityTimestamp = timestamp;
        await db.updateSession(session);
        await logResult(db, { sessionId: session.sessionId, logTimestamp: timestamp, message: "Session updated" })
    } catch (error) {
        throw new Error(`Failed to refresh session due to: ${error}`);
    }
}


// starting point
async function handleSessions(db: dbType, sessionId: string, config) {
    const { timeout } = config;
    const session = await initSession(db, sessionId);
    if (!session) {
        throw new Error("Session not found");
        }
    const now = Date.now();
    if (session && session.lastActivityTimestamp + timeout < now) {
        await clearSession(session, db, now);
    } else {
        await refreshSession(session, db, now);
    }
}