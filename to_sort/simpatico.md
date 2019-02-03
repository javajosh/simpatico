TODO

1. World Event Tree for testing.
2. Handler default result as call pattern
3. Call Pattern collapse.
4. Wrap in convenience class.
5. More handler validation
6. Get zeroing to work.
7. Visualization!

Define Matcher as a form of combination of dead data with a pattern. This will use the simple form of "function collapse" where a function is replaced with it's result. The default output of a handler, therefore, is one of these patterns, which is a tuple of functions denoting acceptable patterns. The handler's contract is that it *only* accepts arguments that pass it's call pattern (that is, collapse it completely). But we don't even need arbitary functions, we generally only need a simple pattern language.

Strings:

1. Regular Expressions for strings. These are well understood and well supported pithy little state-machines.
2. Local Lookup. There exists some (generally pretty static) local list of acceptable values.
3. Remote Lookup. Query a trusted service whether the string is allowed. Reserved for when the data is either too large to move across the network, or a trade secret.

Numbers:
1. Integer range.
2. Integer list

Implement:
1. A Core per person.
2. A Core per room. 
3. People add and remove rooms. (Link and unlink)
3. People enter and exit the rooms. (Focus on a core with person at root and linked cores as children.)
4. People add messages to the room.
5. The rooms messages are *reduced* by an agent into a temporary state.
6. When complete, the final state is added to the room, delimiting input into a sequence of multi-user FSM.

The last step also helps keep the agent computation manageable, as it never has to go back to the beginning of time.

Note that it is pretty possible to link each message to a permanent chain of messages, all the way back to the initiation of the room.

Rights:

1. Clients are allowed to store all data collected in these rooms.
2. Clients are allowed to challenge the inviolability of the room's state.

Control of a well-known data-region as the key to authentication, particularly for payments. You must write a string that the payee generates into a public space, which they accept as a public declaration of purchase. Because purchases are considered private information (and indeed could give you a lot of insight into a person, or a company, based on their purchases) the compromise has been private "user account". 

Applications. Consider a daily newspaper. The room would be the "staff" of the newspaper, and the temporary state would be the (mutable) layout of the edition. Some sequence of messages would pass through the room, collecting into a shared document. The anatomy of the temporary state of the edition is hierarchical, with a more or less arbitrary geometrical transform applied. Think LaTeX. Or PDF. Writers submit stories into spaces, or have space allocated for them. (I think it should be a combination of both!)

# Testing

Interleaved sequence of "call" objects and assertions, often (preferably) in the form of "pattern" objects designed to match the residue after the call is computed. Indeed, the call object should alsways match the call pattern of the previous handler. 