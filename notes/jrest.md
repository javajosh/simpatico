# Is your software stack any good? Answer this one question to find out.

How many changes do you need to make to add new data?
Many stacks require an enormous effort:

  1. The database. `ALTER TABLE ADD COLUMN VARCHAR new_column` + Liquibase migration script + test data
  2. The data classes `String new_column` + unit test
  3. The ORM. + unit test
  4. The endpoint + unit test + functional test
  5. The SPA service. + unit test
  6. The SPA state. + unit test
  7. The SPA Component + unit test + functional test

So approx 15 source changes.
In the best case, it's in one commit, to one branch, with one PR and one merge (but that's rarely the case),
plus a set of change request artifacts in JIRA, for example.

Note that each change is built and deployed in multiple environments:
  1. Local dev
  2. Shared dev
  3. Staging
  4. QA
  5. Production

Depending on how your CI/CD is set up, all of these changes must pass a gauntlet in each environment that may not replicate on the developer machine (BlackDuck code scanning for example).
In non-prod environments, there is a unit test environment, a functional test environment, for both front and back end.

Oh, and you do this for each CRUD operation:
  1. Create
  2. Read
  3. Update
  4. Delete

Create and update often go together and are the trickiest because you need validation.
Read is simpler, and delete is simpler still.

In terms of code you're making 15x4 = 60 changes; in terms of runtime that's 300 changes.
That's for one field, not a new table or relationship or shape of the service endpoint.

Once done, however, the computer does the work in the steady-state, and everyone breathes a sigh of relief.
However the spectre of doing so much work to make changes put a damper on all new substantive product ideas.

*Adding data* should be easy, but it isn't.

# Can we reduce this?

Yes. To eliminate the app server code changes, we use an app server that is tightly coupled to the database.
An example is PostgREST. Another example that effectively eliminates the DB is `json-server`.
In both cases, the API is tightly coupled to the data-structures.
We do the indirection in a more advantageous place.
We use views instead of an app server to control what is exposed.

To reduce the front-end code, we have surprisingly fewer options.
But we can design such a system that, once again, tightly couples the front-end to the service.
In particular, we specify a function that takes a service description (and posit that the service describes itself) and returns an html string.
This string will always show the user, in the most straightforward way, what data is required and what data is returned from the endpoint.
Finally, the code that must be manually entered ends up being the CSS used to manipulate the UX.

