# Draft: A Cat Tail Theory of Human Conflict


Reading the text of my daughters [1st grade safety lectures](https://www.mbfpreventioneducation.org/wp-content/themes/mc-base/data/CSM%20Samples/K.1_Script_CSM_18-19_SAMPLE.pdf) got me thinking.
I think it's mostly harmless, but I don't know.
I have a slight feeling of unease, because of the time and emphasis put on something that, when I was growing up, was handled in private and not considered core to the curriculum.
I have this odd feeling that while I agree that socialization is an important part of school, I'm not sure that implies it should become part of the curriculum.
It's that it's changing the status of something from a social norm to a rule, a law, a lesson.
And while I tend to agree with the content of those lectures, I'm not sure I agree with the act of codification itself.
Which is an unusual feeling, and it deserves exploration at the very least.

Part of my unease is driven by the complexity of conflict itself which gives most abuse its context and justification.
(There are exceptions to this of course - sadism or hedonism of the powerful drives other kinds of abuse)

## You and your cat in the kitchen
To better understand conflict, and it's nuance, consider you and your cat in the kitchen.
Your cat loves you and you love your cat.
She likes to move in and out of your legs, and you like it too.
However, sometimes you step on her tail!
It's an accident.
She doesn't like it, and will yelp and jump, and her feelings may be hurt for some time.
But she'll somehow understand it was just an accident, and eventually will join you in the kitchen again.

But that's just one possible scenario! Here are some variations

- You are angry (maybe at something else and projecting) and you intend to step on the cat!
- The cat assumes it's being attacked, and counter-attacks, biting and scratching!
  - You, having been attacked grow angry (if not already) and start attacking and kicking the cat!
- The cat attacks even though it's tail hasn't been stepped on.
- The cat's tail is short, and hard to step on.
- The cat's tail is very long, and easy to step on.

This is a partial run-through of a sequence of intention, action, reaction tuples that could realistically describe a conflict with your cat.
The length of tail represents our individual personalities and our sensitivity to harm.
As a metaphor, we can be either the human or the cat - but it's most useful to think of ourselves as the cat since it allows us to talk about the length of our tail.

I'd like to write some code to visualize all possible sequences (or at least, the beginning of all possible sequences) of events.
The important point, in my view, is that not all harm requires intention to harm. In fact, it mostly doesn't.
We harm each other all the time without meaning to.
And that doesn't make us bad or abusive. In fact, it just means that humans are sensitive and that's not a bad thing.
But it does mean sensitive people - those with long tails  - need to not assume, and recognize the length of their tails make them not a target, but simply more likely to get hurt.
By the same token, people who step on cat tails need to stop blaming the cat and getting angry at the cat for yelling when their tail is stepped on! It really hurts!
Which you would know if you had a tail.
People who step on cats need to stop saying "well I didn't mean to step on her tail therefore its not my problem if she's hurt or mad. in fact, it's her problem!"
(This one is tricky) cat's who get stepped on need to seriously consider the possibility that they didn't mean it. In general, repetition is what gives away ill intention.
Both people and cats need to take an objective, honest assessment of the length of tail and come up with reasonable precautions to avoid a mistake.
It may be that the combination of cat tail length and human clumsiness is such that it's better to avoid the kitchen entirely, and show affection elsewhere.

1. A - step on the cat by accident.
2. a - automatic yelping, jumping away
3. B - distress; urge to sooth
4. b - calming, recognition that this was a mistake, partly based on B
5. C - distress; mistrust, anger; retaliation
6. c

Action, assessment, reaction

Actions with actual intentions:
Intention: negative, neutral, positive (-1,0,1).
Human:
Cooking in kitchen 0
Step on tail (-1, 0)
Soothe 1
Yell -1
Kick -1

Cat (tail of length L):
Walking in legs 1
Bite legs -1
Yelp 0
Walk away 0
Walk back 1

Note that it is possible for the recipient to assign ANY intention to an action. Consider:
- Soothing is assigned "1" or positive, but soothing may also be a manipulation, a lie, gaslighting.
- Yelling, assigned -1, or negative, may be interpreted as a sign that someone cares enough to engage at all, being preferable to neglect.
- More nuanced, is that sometimes we yell at people we love dearly because they've done something dangerous, we get scared, and at some level we want to share that fear with them for good purpose.
- Think of a young child running into the street. How do you analyze that situation? And, pragmatically, don't get stuck in these weeds because corner cases make terrible law.
- Walking in legs, assigned 1, may be seen as negative by a human that hates cats, or that cat, or who doesn't want to be bothered while cooking.
- Yelping may be assigned negative by a human who is startled, assigning voluntary negativity (they meant to startle me!) to involuntary neutrality.


If we take a specific action to be an arbitrary (small) integer, the intention of the actor is A, the percieved intention is B.
In fact if we draw a coorespondence between intention and action, we can combine these and replace the specific action with just its intentional characterization.
Action, assessment, reaction tuple looks like (0, -1, -1) in the event an accidental step on the cat tail is percieved as aggressive and gets an angry response.
(0, 0, 0) is the case where an accidental tail stomp is perceived as an accident and the cat walks away (to return at a later time).

Of course, there is no reason why this list should be kept so short. In the last case, the human is likely to respond in a soothing way.
We can represent this as (0,0,0,1) and if the cat accepts this "apology" we can say (0,0,0,1,1) - it is purring.
And finally it starts walking in the legs again: (0,0,0,1,1,0).
This is basically the best realistic outcome of the cat-tail metaphor.

We can model a malevolent human and a good cat: (-1,0,0...). The human *meant* to hurt the cat, but the cat responded only neutrally with a yelp and a walk away
We might modify our representation to tuple of tuples ((-1,0),(0,-1)...) which means "a human acted negatively, was percieved nuetrally" and then "a cat acted neutrally, was percieved negatively" and so on.
This representation has a natural visualization as a path on a 2D plane.
A sequence with clear perception would lie on the diagonal.
A sequence with real good feelings would live on the top right.
A sequence with fake good feelings would live on the top left.

Note that this structure actually defines two interleaved paths!
The entries are "action, perception" and alternate between participants.
The generalization would be to include more participants.

## The battle over cat-tail length
Something is missing from this model: cat-tail length.
Cat tail length is proportional to the odds that the tail will be stepped on, by accident or intentionally.
We can say a cat-tail length is a real number between 0 and 1, roughly proportional to the odds that an average human will step on them.
(In reality those odds are a function of the length and also the human's awareness of their feet. Call it "clumsiness" from 0 to 1.)

It's a metaphor for sensitivity.
The first issue to address is this: why not just cut off the tail and avoid the risk?
This would seem to meet everyone's needs.
The cat is safer.
The human is less likely to err and hurt the cat.

The two objections I can think of are sentimental and utilitarian.
First, sentimentally I think tails are lovely and it would be a shame if cats didn't have them.
Second, from a utilitarian perspective the analogy falls short because it's very hard to shorten a tail when the tail is "emotional sensitivity".
You can (and should) shorten your tail with CBT and meditation.
From a utilitarian perspective, you might say that a cat with a very long tail is an invitation for you to grow in awareness of where you put your feet!
This will be handy for you not just with your cat, but with all the other cats in the world, particularly in large groups of cats where even if they have shorter tails,
not stepping on any tail can be a challenge. Your long tail cat is good practice for you.

Then we also have the funny phenomena where some cats want their tail to be longer!
And there are also some people who actively encourage their cats to a) have longer tails and b) interpret tail stomps as malevolent in all cases.
This has to do with fashion. It also has to do with misplaced compassion, or rather cause and effect.
This confusion is best summed up with the old joke, "You better sin because otherwise Jesus died for nothing!"
In this case, "You better get hurt by other people's words, otherwise all our compassion for you (and your kind) is wasted!"

Long tails (extra vulnerability) are popular right now.
An influential group has convinced itself and others that long tails are morally superior.
Some have noted that a long tail has value as a tool of passive-aggressive power when considered superior.
The analogy doesn't cover this well because a cat cannot grow a longer tail.
But a cat may intentionally put its tail in harms way if it believes that, having been stepped on, it will receive a special treat.
The calculus works if the pain of being stepped on is less than the pleasure of the treat.
Humans can pretend to be hurt to get the treat, something virtual every child tries at least once.

The problem with this is that existence of victim-fraud harms real victims.
It steals resources intended for them, physical and emotional.
Sadly, there is no way to determine whether or not someone is a victim or a victim-fraud without being involved.

Compassion for victims is good, but this does not imply giving victims *status* for their victimhood.
It creates a strange double-think situation where "weakness is strength".
This invalidates compassion.
The weak don't need compassion anymore, since they now have compensating status.
Measuring weakness, disability, requires establishing a baseline of normal ability to measure against.
By attacking the reality of a normal baseline, you invalidate the very notion of weakness and disability.
That is, by insisting that the term "long" is itself hurtful, you end up losing the ability to describe the world.
The position becomes incoherent and disconnected from the natural world.
Any human quality can be twisted into a tool of coercive power, including compassion.

## Quadrant analysis
abc
def
ghi

x=actual intention
y=percieved intention
gec = right perception.
abcd = rose-colored glasses
ghif = brown-colored glasses
def = gray-colored glasses
adg/beh/cfi = confusion

This model ignores everything before the cat-tail stomp, so this is a precipitating event.
It then models all subsequent actions as being equivalent to the intention of the actor.
This is also unrealistic, since unskillful communicators are bad at conveying intention.
