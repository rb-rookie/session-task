This project efficiently manages user sessions by tracking timestamps, expiring inactive sessions, and logging relevant events. 

## Key architecture
The logic is separated by their respective operations, each function having a single responsibility (CRUD operation)
The DB logic is separated from session logic and the logging mechanism is extensible without the need to modify the whole file.
The injection of db in the fuctions allow for flexibility (+ easy way to replace the DB engine/instance) with miminal effort.
As a side-effect, testing also becomes easier due to dependency injection.

## Key optimisations
- Error handling controlled by the `logResult` funtion
- `clearSession` checks if a session is already inactive before deletion (DB improvement)
- Config based approach with ability to be extended by environment e.g `setupConfig("development")`

## Assumptions
- DB latency (provided by instructions)
- Session will exist before any handling (it is not a `findOrCreate` situation and session should exist beforehand)
- isActive defines if a session is active. This means that we do not need to delete and update the DB at this stage. 
    - I made the assumption that the isActive is controlled outside of this logic/code
- Expiration is controlled in seconds based on `lastActivityTimestamp` (epoch unix time format) and `timeout`

## Potential improvements
 - With a bit more time, potentially we could look to batch DB operations e.g. push log events in memory and then log events in DB in regular intervals or based on size of logEvents.
 - I had a look that potentially we can combine DB operations with `transactWriteItems` in dynamoDB but that would make the code slightly more coupled between logging and session operations. But the benefit is that it would reduce DB calls by ~50%.
