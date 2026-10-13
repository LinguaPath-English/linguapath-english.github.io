// Authored communication goals, practised in five concrete contexts per unit.
// Maintenance/test source only; the website reads questions.json directly.
const lessons = [];
// Balanced, pre-shuffled answer positions; not a repeating A/B/C/D sequence.
const answerPositions = [
[0,2,2,2,2,1,0,2,0,2,0,1,0,1,0,3,2,0,2,0,2,2,0,2,1,1,0,0,0,2,1,3,1,2,0,3,0,1,0,3,3,1,3,0,2,1,0,0,1,2,0,3,2,3,0,2,2,3,1,3,3,2,1,3,1,1,3,3,1,0,1,3,1,2,1,3,0,1,2,3,0,3,2,3,1,1,2,3,0,1,2,3,0,3,1,3,2,1,3,3],
[2,0,2,0,0,0,1,1,2,3,1,3,1,0,3,3,2,1,0,0,0,0,0,1,1,1,1,3,2,1,3,3,3,1,1,2,3,1,2,3,2,3,3,1,3,3,3,1,0,0,3,0,1,2,3,1,1,0,2,3,0,2,1,3,0,0,2,2,1,0,2,2,3,2,3,2,0,0,1,2,3,3,0,2,0,2,1,2,0,2,1,2,1,1,0,2,3,0,3,2],
[0,0,2,3,0,2,2,0,0,2,2,3,2,3,2,2,0,2,2,2,0,2,0,0,0,2,2,3,3,3,0,3,2,1,2,0,1,0,0,3,0,1,0,3,3,0,3,2,0,3,3,3,3,1,2,1,0,1,2,1,0,3,3,1,3,3,1,1,0,1,1,0,2,1,2,1,0,1,0,3,1,1,1,3,2,1,2,1,0,1,3,1,2,3,2,1,1,3,3,1],
];
function unit(tier, title, cases, make) {
  for (const item of cases) {
    const [task, answer, wrong, explanation] = make(item);
    const number = lessons.filter(q => q.tier === tier).length + 1;
    const choices = [answer, ...wrong];
    const shift = (choices.length - answerPositions[tier - 1][number - 1]) % choices.length;
    lessons.push({ skill: 'Speaking', tier, number,
      prompt: `${title}\nExaminer: "${task}" Choose the response that meets the stated goal.`,
      options: [...choices.slice(shift), ...choices.slice(0, shift)], answer, explanation });
  }
}

unit(1, 'Introducing Yourself', [
  ['Maya','biology','Leeds'], ['Leo','business','Lima'], ['Ana','engineering','Madrid'],
  ['Omar','history','Cairo'], ['Sara','design','Bristol']
], ([name,subject,town]) => [
  `For this role-play, you are ${name}, a ${subject} student from ${town}. Introduce yourself with all three details.`,
  `I'm ${name}, I study ${subject}, and I'm from ${town}.`,
  [`I'm ${name}, and I study ${subject}. My course starts next week.`,
   `I'm from ${town}, and I study ${subject}. I enjoy my classes.`,
   `I'm ${name}, and I'm from ${town}. I like meeting new people.`],
  `The introduction includes the requested name, subject, and hometown. Each other response leaves one of those details out.`
]);
unit(1, 'Describing a Routine', [
  ['have breakfast','take the bus'], ['check my timetable','pack my bag'], ['walk the dog','leave for work'],
  ['make coffee','read the news'], ['open the shop','check the deliveries']
], ([first,second]) => [
  `Your usual morning starts when you ${first}; afterwards you ${second}. Describe that routine in the right order.`,
  `I usually ${first}, and then I ${second}.`,
  [`I usually ${second}, and then I ${first}.`,
   `Yesterday I forgot to ${first} before I could ${second}.`,
   `Tomorrow I might ${second} instead of taking time to ${first}.`],
  `Present-simple verbs with “usually” describe a routine, and “then” preserves the given order. The alternatives reverse the order or describe a different day.`
]);
unit(1, 'Expressing a Preference', [
  ['reading','it helps me relax'], ['cycling','I enjoy being outdoors'], ['cooking','I like trying new recipes'],
  ['drawing','I can express my ideas'], ['swimming','I enjoy being in the water']
], ([activity,reason]) => [
  `Say that you prefer ${activity}, and give this reason: ${reason}.`,
  `I prefer ${activity} because ${reason}.`,
  [`I prefer ${activity}, and I usually do it at the weekend.`,
   `My friend prefers ${activity} and has explained their reasons to me.`,
   `I used to prefer ${activity}, but now I prefer something else.`],
  `The response states the speaker's current preference and links it to the requested reason with “because”. Other preferences can be valid in free speaking.`
]);
unit(1, 'Describing a Place', [
  ['library','near the station','quiet reading rooms'], ['park','beside the river','a small playground'],
  ['café','opposite the school','comfortable seats'], ['museum','in the city centre','local history displays'],
  ['sports centre','behind the college','an indoor pool']
], ([place,location,feature]) => [
  `Describe a ${place} that is ${location} and has ${feature}. Include both location and feature.`,
  `The ${place} is ${location}, and it has ${feature}.`,
  [`The ${place} is ${location}, and I went there last Saturday.`,
   `The ${place} has ${feature}, and many people like going there.`,
   `The ${place} used to be ${location}, but it has moved now.`],
  `The chosen response includes both facts about the place. Visiting it, praising it, or saying it moved does not supply the requested description.`
]);
unit(1, 'Describing a Future Plan', [
  ['visit my cousin','Saturday','visited my cousin'], ['join a course','Monday','joined a course'], ['start my new job','Friday','started my new job'],
  ['travel to York','Tuesday','travelled to York'], ['meet my study group','Thursday','met my study group']
], ([action,day,completed]) => [
  `Your plan for next week is to ${action.replace(/\bmy\b/g,'your')} on ${day}. Say what you intend to do.`,
  `I'm going to ${action} on ${day}.`,
  [`I ${completed} last ${day}.`,
   `I didn't ${action} last ${day}, unfortunately.`,
   `I might ${action}, but I haven't made any plans.`],
  `“I'm going to” expresses the stated future intention. The alternatives describe past events or an undecided possibility rather than the given plan.`
]);
unit(1, 'Asking for Clarification', [
  ['meeting time','What time does the meeting start?'], ['classroom','Which room is the class in?'],
  ['submission date','What date is the work due?'], ['bus number','Which bus should I take?'],
  ['ticket price','How much does the ticket cost?']
], ([detail,question]) => [
  `You did not hear the ${detail}. Ask the other person to clarify that detail.`,
  `Sorry, ${question.charAt(0).toLowerCase()+question.slice(1)}`,
  [`I'm sorry I gave you the wrong ${detail} yesterday.`,
   `Thanks, I know the ${detail} now.`,
   `Could we change the ${detail} to suit the group?`],
  `A clarification request asks for missing information. Apologising, confirming you know it, and requesting a change are different functions.`
]);
unit(1, 'Offering Help', [
  ['carry your bag'], ['find your classroom'], ['print your notes'], ['hold the door'], ['move the chairs']
], ([action]) => [
  `Use a question to offer to ${action.replace(/\byour\b/g,'their')} for the other person, leaving them free to accept or decline.`,
  `Would you like me to ${action}?`,
  [`Could you ${action} instead?`,
   `I'll ${action} now, as we already agreed.`,
   `Could someone help me ${action} before we leave?`],
  `“Would you like me to …?” offers the speaker's help without assuming acceptance. “Could you …?” asks the listener to act instead.`
]);
unit(1, 'Making a Polite Request', [
  ['lend me a pen'], ['send me the link'], ['open the window'], ['repeat the address'], ['share your notes']
], ([action]) => [
  `Use a polite question to ask the other person to ${action.replace(/\bme\b/g,'you').replace(/\byour\b/g,'their')}. Do not announce that they have already done it.`,
  `Could you ${action}, please?`,
  [`Thanks for agreeing to ${action}.`,
   `You must ${action} immediately, without asking why.`,
   `I can help you later, after someone has agreed to ${action}.`],
  `“Could you …, please?” asks the listener to carry out the action. The alternatives assume an earlier agreement, make a demand, or describe the speaker helping later.`
]);
unit(1, 'Accepting an Invitation', [
  ['dinner'], ['the concert'], ['the picnic'], ['the study session'], ['the birthday party']
], ([event]) => [
  `A friend invites you to ${event}. Accept the invitation and thank them.`,
  `I'd love to come to ${event}. Thanks for inviting me.`,
  [`Sorry, I can't come to ${event}.`,
   `Could you tell me more about ${event} before I decide?`,
   `I enjoyed ${event} last week. Thank you for coming.`],
  `“I'd love to come” accepts a future invitation, and the second sentence thanks the inviter. The alternatives decline, delay the decision, or discuss a past event.`
]);
unit(1, 'Declining an Invitation', [
  ['a cinema trip','work late'], ['the picnic','visit my family'], ['the meal','attend a class'],
  ['the concert','finish a project'], ['the trip','help my brother']
], ([event,reason]) => [
  `You cannot join ${event} because you have to ${reason.replace(/\bmy\b/g,'your')}. Decline politely and give that reason.`,
  `Thanks for asking, but I can't join ${event}; I have to ${reason}.`,
  [`Thanks for asking. I can join ${event} after I ${reason}.`,
   `My friend can't join ${event}, but I am free to come.`,
   `I enjoyed ${event}, and I managed to ${reason} afterwards.`],
  `The response thanks the inviter, clearly declines, and gives the stated reason. The other choices accept or describe another person or a past event.`
]);
unit(1, 'Apologising and Offering a Remedy', [
  ['being late','come earlier next time'], ['sending the wrong file','send the correct one now'],
  ['forgetting your book','bring it tomorrow'], ['missing your call','call you back now'],
  ['spilling the drink','clean it up now']
], ([problem,remedy]) => [
  `Apologise for ${problem.replace(/\byour\b/g,'their')} and offer to ${remedy.replace(/\byou\b/g,'them')}.`,
  `I'm sorry for ${problem}. I'll ${remedy}.`,
  [`I'm sorry for ${problem}.`,
   `You should apologise for ${problem}; I was waiting for you.`,
   `Someone else caused that problem; it was not my responsibility.`],
  `The speaker accepts the problem and proposes the requested remedy. Changing the topic or shifting responsibility does not meet both parts of the goal.`
]);
unit(1, 'Thanking Someone', [
  ['explaining the exercise'], ['lending me your notes'], ['carrying my suitcase'],
  ['waiting for me'], ['sending the directions']
], ([help]) => [
  `Someone has helped you by ${help.replace(/\bme\b/g,'you').replace(/\byour\b/g,'their').replace(/\bmy\b/g,'your')}. Thank them for that completed action.`,
  `Thank you for ${help}. I really appreciate it.`,
  [`Would you mind helping me by ${help} again when you have some time?`,
   `You're welcome; I was glad to help.`,
   `I'm sorry I could not help yesterday.`],
  `“Thank you for” names the help received. Asking for future help, replying to thanks, and apologising are not the same function.`
]);
unit(1, 'Acknowledging Disappointment', [
  ['my trip was cancelled'], ['I lost my favourite book'], ['I missed the concert'],
  ['my team lost the match'], ['I did not get the part in the play']
], ([news]) => [
  `A friend says: ${news}. Acknowledge their disappointment kindly, without blaming them or making a guarantee.`,
  `I'm sorry to hear that. It must be disappointing.`,
  [`You should have planned better.`,
   `I'm certain we can make everything work out perfectly next time.`,
   `I had a great weekend with my friends.`],
  `The response acknowledges the friend's feeling. Blame, an unsupported guarantee, and changing the topic do not provide that acknowledgement.`
]);
unit(1, 'Giving Relevant Advice', [
  ['I keep forgetting deadlines','write them in a calendar'],
  ['I cannot find my class notes','put them in labelled folders'],
  ['I rush my homework','start it earlier'],
  ['I do not understand the instructions','ask the tutor to explain them'],
  ['I keep losing my keys','keep them in the same place']
], ([problem,advice]) => [
  `A friend says: ${problem}. Recommend that they ${advice}, using an advice form.`,
  `You could ${advice}; that might help.`,
  [`I usually ${advice} when I encounter that problem myself.`,
   `You could leave things exactly as they are.`,
   `When you next see your friends, ask what they are doing at the weekend.`],
  `“You could” recommends a possible action relevant to the stated problem. The alternatives assert a fact, discuss the speaker, or advise the opposite.`
]);
unit(1, 'Suggesting a Shared Activity', [
  ['go for a walk'], ['visit the museum'], ['play a board game'], ['study together'], ['try the new café']
], ([activity]) => [
  `Use a question to suggest that you and a friend ${activity}. Ask rather than assuming they agree.`,
  `How about we ${activity} this afternoon?`,
  [`Let's ${activity} this afternoon.`,
   `Are you going to ${activity} alone tomorrow?`,
   `We did not ${activity} yesterday because we were busy.`],
  `“How about we …?” uses a question to propose a shared activity. “Let's …” can also be a good suggestion, but does not use the question form required here.`
]);
unit(1, 'Describing a Past Event', [
  ['visited a museum','had lunch'], ['went to a concert','met my friends'],
  ['walked in the park','took some photos'], ['attended a workshop','practised at home'],
  ['played a match','rested afterwards']
], ([first,second]) => [
  `Yesterday you ${first}, then ${second}. Describe those completed events in order.`,
  `Yesterday I ${first}, and then I ${second}.`,
  [`Yesterday I ${second}, and then I ${first}.`,
   `Tomorrow I will do something different from what I did yesterday.`,
   `I haven't decided whether to do either activity next weekend.`],
  `Past-simple verbs describe the completed events, and “then” preserves their order. Other answers reverse the sequence or do not report those events.`
]);
unit(1, 'Giving a Reason', [
  ['history','learning about the past'], ['photography','capturing interesting details'],
  ['music','discovering different sounds'], ['gardening','growing things'], ['travel','seeing new places']
], ([interest,reason]) => [
  `Explain why you like ${interest}: you enjoy ${reason}. Include the reason.`,
  `I like ${interest} because I enjoy ${reason}.`,
  [`I like ${interest}, and I have liked it for several years.`,
   `My friend likes ${interest}, but I prefer something else.`,
   `I used to like ${interest}, although I no longer do.`],
  `“Because” connects the preference to its requested reason. Duration alone does not explain why the speaker likes the activity.`
]);
unit(1, 'Asking a Focused Follow-Up', [
  ['I joined a photography club','the kinds of photos they like taking','What kind of photos do you like taking?', ['When does the club meet?','Who runs the photography club?','How did you hear about the club?']],
  ['I started a new course','the subject they are studying','What are you studying on the course?', ['Where are your classes held?','When did the course start?','Who teaches your course?']],
  ['I moved to a new town','what the town is like','What is your new town like?', ['When did you move there?','Who helped you move?','How did you travel to your new town?']],
  ['I saw a play last night','the story of the play','What was the play about?', ['Where did you see the play?','Who went with you to the theatre?','How much did the tickets cost?']],
  ['I tried a new recipe','the dish they made','What did you cook?', ['Where did you find the recipe?','Who tried the food with you?','When did you cook it?']]
], ([news,focus,question,wrong]) => [
  `A friend says: ${news}. Ask a follow-up specifically about ${focus}.`,
  question,
  wrong,
  `The question asks about ${focus}. The other questions are relevant conversation starters too, but ask about different details from the stated goal.`
]);
unit(1, 'Describing a Feeling', [
  ['nervous','I have a presentation tomorrow'], ['excited','my trip starts tomorrow'],
  ['disappointed','the match was cancelled'], ['proud','I finished a difficult project'],
  ['relieved','I found my missing notes']
], ([feeling,reason]) => [
  `Say that you feel ${feeling} and explain why: ${reason}.`,
  `I feel ${feeling} because ${reason}.`,
  [`My friend feels ${feeling} because ${reason.replace(/\bI\b/g,'they').replace(/\bmy\b/g,'their')}.`,
   `I felt ${feeling} yesterday.`,
   `I feel ${feeling} today.`],
  `The response names the speaker's current feeling and supplies the requested reason. Referring to someone else or withholding the reason does not meet the goal.`
]);
unit(1, 'Checking Understanding', [
  ['the meeting starts at three'], ['the class is in room twelve'], ['the deadline is Friday'],
  ['the bus leaves at eight'], ['the tickets cost ten pounds']
], ([fact]) => [
  `Check that you heard this correctly: ${fact}. Ask for confirmation, not a change.`,
  `So ${fact}, is that right?`,
  [`Could we change that arrangement?`,
   `I know that ${fact}; I've already told the rest of the group.`,
   `Please cancel that arrangement.`],
  `A statement followed by “is that right?” checks understanding. Changing, cancelling, or refusing confirmation has a different purpose.`
]);

unit(2, 'Comparing Two Options', [
  ['train','a shorter journey','bus','a lower fare'], ['city','more job opportunities','countryside','more living space'],
  ['online course','more flexible hours','campus course','face-to-face discussion'],
  ['e-book','easy portability','printed book','space for handwritten notes'],
  ['group study','shared feedback','individual study','fewer distractions']
], ([a,benefitA,b,benefitB]) => [
  `Compare the ${a} and ${b} options. Mention the given benefit of each: ${benefitA} and ${benefitB}.`,
  `The ${a} option offers ${benefitA}, whereas the ${b} option offers ${benefitB}.`,
  [`The ${a} option offers ${benefitB}, whereas the ${b} option offers ${benefitA}.`,
   `The ${a} option offers ${benefitA}, so the ${b} option must have no benefits.`,
   `Both options offer ${benefitA}; there is no difference worth discussing between them.`],
  `“Whereas” makes the comparison explicit and assigns each stated benefit to the correct option. It does not imply that one option is universally better.`
]);
unit(2, 'Supporting a Stated Position', [
  ['support a later library closing time','evening students need access'],
  ['oppose a compulsory weekend class','some students work at weekends'],
  ['support a quieter study room','noise makes concentration difficult'],
  ['oppose removing printed notices','not every visitor uses the website'],
  ['support an extra bus service','the current buses are crowded']
], ([position,reason]) => [
  `For this role-play, ${position}. Explain the given reason: ${reason}.`,
  `I ${position} because ${reason}.`,
  [`I ${position}.`,
   `Some people ${position}, although I have not decided what my own position is.`,
   `I used to ${position}, but I now take the opposite position for a different reason.`],
  `The response expresses the assigned role-play position and supports it with the specified reason. A different personal opinion can be valid in an open speaking task.`
]);
unit(2, 'Disagreeing Respectfully', [
  ['the plan saves money','it leaves too little time for testing'],
  ['the room is convenient','it is too small for the group'],
  ['the app is easy to use','it lacks the feature we need'],
  ['the timetable is simple','it does not allow travel time'],
  ['the event sounds enjoyable','the ticket is outside our budget']
], ([shared,concern]) => [
  `Acknowledge that ${shared}, then explain your concern that ${concern}.`,
  `I agree that ${shared}, but I'm concerned that ${concern}.`,
  [`I agree that ${shared}.`,
   `I'm concerned that ${concern}. What do you think?`,
   `I agree that ${shared}, but I don't share the concern that ${concern}.`],
  `The response separates acknowledgement from disagreement using “but” and identifies the specific concern without attacking the person.`
]);
unit(2, 'Clarifying a Term', [
  ['optional'], ['deposit'], ['priority'], ['draft'], ['feedback']
], ([term]) => [
  `You understand the date and place, but not the term ${term}. Ask what the term means in these instructions.`,
  `Could you explain what ${term} means in these instructions?`,
  [`Could you confirm the date and place again before we discuss the instructions?`,
   `Could you remove ${term} from the instructions without explaining its meaning?`,
   `Could you confirm that everyone already understands the term ${term}?`],
  `“What … means” asks for the missing definition. Rechecking known logistics or asking to remove the word does not clarify its meaning.`
]);
unit(2, 'Restating Instructions', [
  ['complete the form','send it to reception'], ['read the article','prepare two questions'],
  ['check the figures','email the report'], ['choose a topic','ask the tutor to approve it'],
  ['book a room','tell the group where to meet']
], ([first,second]) => [
  `Restate the instructions: first ${first}, then ${second}. Keep both actions in that order.`,
  `So I need to ${first} before I ${second}.`,
  [`So I need to ${second} before I ${first}.`,
   `So I only need to ${first}; the second action is no longer required.`,
   `So I should wait until someone else has completed both actions for me.`],
  `“Before” preserves the sequence and includes both required actions. The alternatives reverse, omit, or transfer the instructions.`
]);
unit(2, 'Justifying a Recommendation', [
  ['use the train','it avoids the traffic'], ['choose the smaller room','it is within our budget'],
  ['start the project earlier','it allows time for checking'], ['keep the printed guide','some visitors cannot get online'],
  ['record the lecture','absent students can review it']
], ([action,reason]) => [
  `Recommend that we ${action}, and justify it with this reason: ${reason}.`,
  `I'd recommend that we ${action} because ${reason}.`,
  [`We decided to ${action} yesterday.`,
   `I'd recommend a different action, even though ${reason}.`,
   `I might ${action} myself when I make my own arrangements for next week.`],
  `The speaker recommends an action to the group and explicitly links it to the given benefit. A personal possibility is not the requested recommendation.`
]);
unit(2, 'Contrasting Past and Present', [
  ['travelled by car','use the bus'], ['studied only at night','study in the morning'],
  ['kept paper notes','store notes digitally'], ['worked alone','work with a partner'],
  ['bought lunch','bring lunch from home']
], ([past,present]) => [
  `Explain this change: you previously ${past}, but now you ${present}. Keep the time contrast clear.`,
  `I previously ${past}, whereas now I ${present}.`,
  [`I still do exactly what I did before; there has been no change in my routine.`,
   `I plan to ${present} in the future, although I have not changed my routine yet.`,
   `My friend has changed their routine, but I have not changed mine at all.`],
  `“Previously” and “now” distinguish the two periods, and “whereas” marks the contrast in the stated direction.`
]);
unit(2, 'Making an Uncertain Prediction', [
  ['the course may attract more students','the timetable is flexible'],
  ['the café may become busier','the new station opens'],
  ['the team may finish earlier','the extra equipment arrives'],
  ['the event may move indoors','the weather changes'],
  ['the service may become cheaper','more providers join']
], ([prediction,condition]) => [
  `Make this prediction conditional, not certain: ${prediction}, if ${condition}.`,
  `I think ${prediction} if ${condition}, although we cannot be certain yet.`,
  [`I guarantee that the prediction will come true, whatever happens to the condition.`,
   `The predicted event has already happened, so there is nothing uncertain about the future.`,
   `The condition is irrelevant; it cannot affect whether the predicted event happens.`],
  `“May” expresses possibility and “if” supplies the condition. The final clause explicitly avoids guaranteeing the outcome.`
]);
unit(2, 'Explaining a Sequence', [
  ['choose a topic','collect information','write an outline'],
  ['check the route','buy a ticket','board the train'],
  ['measure the room','choose the furniture','arrange delivery'],
  ['test the prototype','record the results','discuss improvements'],
  ['agree on a date','book the venue','send invitations']
], ([a,b,c]) => [
  `Explain this agreed sequence: ${a}, then ${b}, and finally ${c}.`,
  `First we ${a}, then we ${b}, and finally we ${c}.`,
  [`First we ${c}, then we ${a}, and finally we ${b}.`,
   `First we ${b}, then we ${c}, and finally we ${a}.`,
   `We only need to ${a}; the other two agreed steps can be omitted.`],
  `The sequence markers preserve all three steps in the agreed order rather than changing or shortening the process.`
]);
unit(2, 'Giving a Professional Apology', [
  ['the delayed reply','reply this afternoon'], ['the incorrect attachment','send the right file'],
  ['the missed appointment','offer a new time'], ['the booking error','correct the reservation'],
  ['the missing handout','provide a copy today']
], ([problem,repair]) => [
  `You are responsible for ${problem}. Apologise professionally and say you will ${repair}.`,
  `I apologise for ${problem}. I will ${repair} to put it right.`,
  [`I noticed ${problem} this morning.`,
   `I apologise for ${problem}; I have received several messages about it this morning.`,
   `Could you apologise to the customer for ${problem} and discuss what to do next?`],
  `The response accepts responsibility and states a concrete repair. A professional apology should not shift blame or promise no action.`
]);
unit(2, 'Requesting an Action by a Deadline', [
  ['send the figures','Monday'], ['confirm the booking','Tuesday'], ['review the draft','Wednesday'],
  ['approve the schedule','Thursday'], ['return the form','Friday']
], ([action,day]) => [
  `Politely ask a colleague to ${action} by ${day}. Include both the action and deadline.`,
  `Could you ${action} by ${day}, please?`,
  [`Could you ${action} when convenient? There is no deadline for this request.`,
   `I will ${action} by ${day}; you do not need to do anything.`,
   `Could you wait until after ${day} before taking any action on this request?`],
  `The polite question addresses the colleague and specifies the deadline. The alternatives remove it, make a promise instead, or require the wrong timing.`
]);
unit(2, 'Negotiating a Meeting Time', [
  ['Monday','Tuesday'], ['Tuesday','Wednesday'], ['Wednesday','Thursday'],
  ['Thursday','Friday'], ['Friday','Monday']
], ([busy,free]) => [
  `You cannot meet on ${busy}, but you are free on ${free}. Explain the conflict and suggest the alternative.`,
  `I'm unavailable on ${busy}. Could we meet on ${free} instead?`,
  [`I'm unavailable on ${free}. Could we meet on ${busy} instead?`,
   `I'm unavailable on ${busy}, so I will attend at the time already proposed.`,
   `I'm free on ${free}, but I would prefer not to suggest any alternative time.`],
  `The response declines the conflicting time and proposes the stated available day, rather than reversing availability or leaving the problem unresolved.`
]);
unit(2, 'Explaining a Problem and Remedy', [
  ['the room is too noisy','move to a quiet room'], ['the file is too large','send a download link'],
  ['the instructions are unclear','add a worked example'], ['the queue is too long','open another desk'],
  ['the timetable overlaps','move one of the sessions']
], ([problem,remedy]) => [
  `Explain that ${problem}, then propose that we ${remedy}.`,
  `The problem is that ${problem}. We could ${remedy} to address it.`,
  [`The problem is that ${problem}.`,
   `We could ${remedy}; I suggested doing that at our planning meeting last week.`,
   `Someone else mentioned that ${problem}; I suggest keeping the current arrangement for now.`],
  `The response connects a specific problem to a proposed remedy. Naming only the problem or only the action leaves out part of the requested explanation.`
]);
unit(2, 'Illustrating a Claim', [
  ['small steps make a task manageable','divide a report into sections'],
  ['planning can prevent confusion','give each team member a named task'],
  ['feedback can guide improvement','revise an introduction after a tutor comments on it'],
  ['practice can build confidence','rehearse a presentation with a friend'],
  ['clear labels can save time','label folders so documents are easier to find']
], ([claim,example]) => [
  `Support the claim that ${claim}. Use this concrete example: ${example}.`,
  `${claim.charAt(0).toUpperCase()+claim.slice(1)}; for example, you can ${example}.`,
  [`${claim.charAt(0).toUpperCase()+claim.slice(1)}.`,
   `People have discussed this claim at several meetings, and the topic also came up during the workshop.`,
   `You can ${example}, but that has no connection with the claim we are discussing.`],
  `“For example” connects the general claim with an observable action. Restating the claim without illustrating it does not fulfil the goal.`
]);
unit(2, 'Clarifying Two Requirements', [
  ['bring an ID card','arrive ten minutes early'], ['read the first chapter','prepare one question'],
  ['submit a PDF','include your name'], ['book a place','pay before Friday'],
  ['wear suitable shoes','bring drinking water']
], ([a,b]) => [
  `Confirm these two requirements without adding an extra rule: ${a} and ${b}.`,
  `So I need to ${a} and ${b}; is that correct?`,
  [`So I only need to ${a}; I do not have to ${b}, correct?`,
   `So I only need to ${b}; the other requirement does not apply to me, correct?`,
   `So both requirements are optional and I can ignore them if I prefer, correct?`],
  `The confirmation retains both requirements and asks whether they were understood correctly. Each alternative weakens or removes a stated requirement.`
]);
unit(2, 'Reporting Different Perspectives', [
  ['Rina','values lower costs','Sam','values shorter travel time'],
  ['Amir','wants flexible hours','Jo','wants a fixed routine'],
  ['Mina','prefers a quiet room','Ben','prefers discussion'],
  ['Eva','supports an earlier start','Luis','supports a later finish'],
  ['Tom','values digital access','Nora','values printed materials']
], ([a,viewA,b,viewB]) => [
  `Report the two views accurately: ${a} ${viewA}; ${b} ${viewB}. Do not claim they agree.`,
  `${a} ${viewA}, whereas ${b} ${viewB}.`,
  [`${a} ${viewB}, whereas ${b} ${viewA}.`,
   `Both speakers ${viewA.replace(/^(\w+)s\b/, '$1')}; there is no difference between their priorities.`,
   `${a} and ${b} have changed their minds and now hold exactly the same view.`],
  `The response attributes each view to the correct person and contrasts them without deciding that either preference is wrong.`
]);
unit(2, 'Balancing a Benefit and Limitation', [
  ['recorded lectures','can be replayed','do not allow live questions'],
  ['online meetings','save travel time','depend on a reliable connection'],
  ['group projects','allow shared ideas','require coordination'],
  ['printed guides','work without a device','can become outdated'],
  ['flexible hours','allow personal planning','can make team scheduling harder']
], ([topic,benefit,limit]) => [
  `Discuss ${topic} using both given points: they ${benefit}, but they ${limit}.`,
  `Although ${topic} ${benefit}, they also ${limit}.`,
  [`${topic.charAt(0).toUpperCase()+topic.slice(1)} ${benefit}, so they cannot have any limitations.`,
   `${topic.charAt(0).toUpperCase()+topic.slice(1)} ${limit}, so they cannot offer any benefits.`,
   `${topic.charAt(0).toUpperCase()+topic.slice(1)} have been discussed by the group, and we plan to return to the topic next week.`],
  `“Although” links the benefit to the limitation. The other choices dismiss one side or avoid discussing the supplied points.`
]);
unit(2, 'Acknowledging a Concern and Suggesting a Step', [
  ['the presentation','practise the opening together'], ['the assignment','ask the tutor about the unclear part'],
  ['the group project','agree on who will do each task'], ['the timetable','check which sessions are essential'],
  ['the interview','prepare examples of your experience']
], ([concern,step]) => [
  `A friend is worried about ${concern}. Acknowledge the concern and suggest that we ${step}.`,
  `I understand why you're worried about ${concern}. We could ${step}.`,
  [`You do not need to worry about ${concern}.`,
   `I'm certain that ${concern} will go perfectly, even if we do not make any preparations.`,
   `I understand why you're worried about ${concern}; you mentioned the same concern yesterday.`],
  `The response acknowledges the feeling and suggests a practical action. It avoids dismissing the concern or promising a result it cannot guarantee.`
]);
unit(2, 'Asking About a Reason', [
  ['join the club'], ['choose the course'], ['change your timetable'], ['apply for the role'], ['move to the new town']
], ([action]) => [
  `You know your friend decided to ${action}. Ask about their reason, not simply whether they made the decision.`,
  `What made you decide to ${action}?`,
  [`Did you decide to ${action}, or have you not decided yet?`,
   `What time will you be available to discuss the decision?`,
   `Who already knows that you decided to ${action}?`],
  `“What made you decide” requests motivation. The alternatives ask for confirmation, scheduling, or who knows about the decision.`
]);
unit(2, 'Separating Agreement From a Concern', [
  ['the goal is useful','the deadline is unrealistic'], ['the content is relevant','the examples are unclear'],
  ['the venue is suitable','the travel cost is high'], ['the design is attractive','the text is hard to read'],
  ['the idea is promising','the testing is incomplete']
], ([agreement,concern]) => [
  `Make clear that you agree ${agreement}, but your concern is that ${concern}.`,
  `I agree that ${agreement}; my concern is that ${concern}.`,
  [`I disagree that ${agreement}, and I have no concerns about any other part.`,
   `I agree with every part, and I do not share the concern that ${concern}.`,
   `I agree that ${agreement}; we discussed that point during the previous meeting.`],
  `The response distinguishes the shared point from the particular reservation rather than rejecting the whole proposal or concealing the concern.`
]);

unit(3, 'Qualifying an Observed Change', [
  ['reminders were introduced','assignment completion improved'],
  ['opening hours were extended','visitor numbers increased'],
  ['the timetable changed','attendance improved'],
  ['the website was redesigned','more bookings were made'],
  ['a mentoring scheme began','more students stayed on the course']
], ([change,result]) => [
  `In an observational report, ${result} after ${change}. Explain the pattern without treating timing alone as proof of cause.`,
  `${result.charAt(0).toUpperCase()+result.slice(1)} after ${change}, but other factors could have contributed.`,
  [`${result.charAt(0).toUpperCase()+result.slice(1)} after ${change}, which establishes that the change caused the improvement.`,
   `Because ${change}, we can rule out any contribution from other changes during that period.`,
   `The report shows that the improvement caused the earlier change, rather than the other way round.`],
  `The response reports the observed sequence and qualifies the causal interpretation. An observational before-and-after pattern alone does not rule out other contributing factors.`
]);
unit(3, 'Distinguishing Association From Cause', [
  ['frequent practice','higher course scores'], ['longer journeys','lower attendance'],
  ['regular feedback','more completed tasks'], ['clearer instructions','fewer help requests'],
  ['earlier planning','fewer missed deadlines']
], ([a,b]) => [
  `A survey finds an association between ${a} and ${b}. Describe the association without claiming a proven causal direction.`,
  `The survey links ${a} with ${b}, but it does not establish which factors cause the pattern.`,
  [`The survey proves that ${a} led to ${b}, rather than merely being associated with it.`,
   `The survey proves that ${b} led to ${a}, rather than merely being associated with it.`,
   `The survey found no relationship between the two measures, so there is no pattern to discuss.`],
  `“Links … with” reports association without choosing a causal direction. The other responses claim causation or deny the reported association.`
]);
unit(3, 'Addressing a Counterargument', [
  ['longer opening hours','staffing costs','trial the hours on two evenings'],
  ['a digital guide','limited device access','retain a printed version'],
  ['a group assignment','unequal workload','assign and review responsibilities'],
  ['an earlier start','transport difficulties','check transport before confirming the time'],
  ['a larger event','noise for neighbours','agree on a finishing time with the venue']
], ([plan,concern,response]) => [
  `You support ${plan}. Address the concern about ${concern} and propose that we ${response}.`,
  `The concern about ${concern} is reasonable; we could ${response} before committing fully.`,
  [`The concern about ${concern} is reasonable, so I would stop discussing the proposal altogether.`,
   `The proposal offers benefits, which makes the concern about ${concern} less important than our original aim.`,
   `We could proceed with ${plan} first and consider any concerns only after the arrangement is permanent.`],
  `The response acknowledges the counterargument and offers the requested practical response. It does not dismiss the concern or abandon the discussion without considering that response.`
]);
unit(3, 'Making a Conditional Recommendation', [
  ['extend the pilot','the trial stays within budget'], ['adopt the software','the accessibility tests pass'],
  ['increase the group size','another tutor is available'], ['move the event outdoors','a covered backup space is ready'],
  ['publish the schedule','all departments confirm their availability']
], ([action,condition]) => [
  `Recommend that we ${action}, but only if ${condition}. Make that condition necessary, not optional.`,
  `I would recommend that we ${action}, provided that ${condition}.`,
  [`I would recommend that we ${action}, whether or not ${condition}.`,
   `I would recommend that we ${action}, despite the fact that the condition has not been checked.`,
   `I would recommend that we avoid taking this action even if ${condition}.`],
  `“Provided that” makes the condition necessary for the recommendation. “Whether or not” removes it, while “despite” bypasses it.`
]);
unit(3, 'Attributing Contrasting Views', [
  ['Alex','favours a small pilot','Rina','prefers immediate rollout'],
  ['Jo','prioritises lower costs','Sam','prioritises faster delivery'],
  ['Mina','supports a fixed timetable','Ben','supports flexible hours'],
  ['Eva','recommends printed materials','Luis','recommends digital materials'],
  ['Nora','wants individual assessment','Tom','wants group assessment']
], ([a,viewA,b,viewB]) => [
  `Attribute these views correctly: ${a} ${viewA}; ${b} ${viewB}. Contrast the views without endorsing one.`,
  `${a} ${viewA}, while ${b} ${viewB}; they are proposing different approaches.`,
  [`${a} ${viewB}, while ${b} ${viewA}; they are proposing different approaches.`,
   `${a} and ${b} agree on the first approach, although they use different words to describe it.`,
   `Neither speaker has proposed an approach, so there are no views to attribute or compare yet.`],
  `The response preserves the attribution and signals contrast without treating either speaker's preference as an objective fact.`
]);
unit(3, 'Summarising a Finding and an Exception', [
  ['most users found the website easier','some could not use the search tool'],
  ['most students liked the timetable','some had travel conflicts'],
  ['most visitors welcomed longer hours','some preferred morning sessions'],
  ['most staff used the new system','some needed extra training'],
  ['most participants finished the task','some required an extension']
], ([main,exception]) => [
  `Summarise both findings: ${main}, but ${exception}. Preserve the exception.`,
  `${main.charAt(0).toUpperCase()+main.slice(1)}, although ${exception}.`,
  [`${main.charAt(0).toUpperCase()+main.slice(1)}, so the report contains no exceptions worth noting.`,
   `${exception.charAt(0).toUpperCase()+exception.slice(1)}, which shows that the positive finding did not occur.`,
   `Everyone had the same experience, so the findings can be summarised without a distinction between groups.`],
  `“Although” retains the main finding and the exception. A summary should not turn “most” into “everyone” or let an exception erase the majority finding.`
]);
unit(3, 'Making a Concession', [
  ['the method is convenient','its accuracy has not been checked'],
  ['the plan saves time','its costs remain uncertain'],
  ['the venue is central','its access arrangements need improvement'],
  ['the design is attractive','its readability needs testing'],
  ['the proposal is popular','its practical effects remain unclear']
], ([benefit,limitation]) => [
  `Acknowledge that ${benefit}. Then make this your main reservation: ${limitation}.`,
  `Although ${benefit}, my reservation is that ${limitation}.`,
  [`Because ${benefit}, there is no need to investigate the remaining reservation.`,
   `I reject the claim that ${benefit}; only the negative aspects deserve attention.`,
   `I accept both points, but I will recommend the proposal without resolving the reservation.`],
  `The concessive clause acknowledges a positive point; the main clause keeps the stated limitation in focus. A concession does not cancel the reservation.`
]);
unit(3, 'Limiting a Generalisation', [
  ['one small class'], ['one local branch'], ['a single workshop'], ['one volunteer group'], ['one short trial']
], ([sample]) => [
  `Feedback came only from ${sample}. Explain why the findings may not apply to every setting, without dismissing the feedback altogether.`,
  `The feedback is useful for ${sample}, but a wider sample would be needed before generalising.`,
  [`The feedback from ${sample} is sufficient to describe every other setting without further checks.`,
   `Because the sample is limited, none of the participants' observations can have any value.`,
   `The report represents a broad range of settings rather than the limited sample described.`],
  `The response recognises the feedback's local value and the limit on generalisation. A limited sample is neither universal evidence nor automatically worthless.`
]);
unit(3, 'Giving Specific Diplomatic Feedback', [
  ['the report','explain how the sample was selected'], ['the presentation','define the unfamiliar terms'],
  ['the proposal','give a clearer cost estimate'], ['the instructions','show a worked example'],
  ['the schedule','allow more time between sessions']
], ([work,improvement]) => [
  `Give constructive feedback on ${work}. Suggest that the author ${improvement}, without criticising their character.`,
  `To strengthen ${work}, could you ${improvement}? That would address the unclear part.`,
  [`${work.charAt(0).toUpperCase()+work.slice(1)} is unclear because you are careless; this happens with all your work.`,
   `I would revise ${work} completely, although I cannot identify a specific change to suggest.`,
   `Your previous work was clearer than ${work}; I preferred that earlier version.`],
  `The feedback identifies an actionable revision and focuses on the work. A personal criticism, an unspecified rewrite, or a comparison without a suggestion does not supply that step.`
]);
unit(3, 'Explaining a Trade-Off', [
  ['a cheaper venue','a longer journey'], ['faster delivery','a higher price'],
  ['a smaller class','fewer available places'], ['more flexible hours','harder team scheduling'],
  ['a simpler design','fewer customisation options']
], ([benefit,cost]) => [
  `Explain the trade-off: choosing ${benefit} also means accepting ${cost}. Keep both sides explicit.`,
  `We could choose ${benefit}, but we would need to accept ${cost} as the trade-off.`,
  [`We could choose ${benefit}, so there is no need to mention any cost associated with it.`,
   `We would have to accept ${cost}, which means there cannot be any benefit from the option.`,
   `The two points describe identical benefits, so no trade-off needs to be considered.`],
  `“But” and “trade-off” connect the benefit to its associated cost instead of presenting one side as the whole decision.`
]);
unit(3, 'Correcting a Misinterpretation Politely', [
  ['the trial lasted two weeks','the trial lasted two months'],
  ['the fee includes materials','the fee excludes materials'],
  ['the deadline is provisional','the deadline is final'],
  ['the meeting is optional','the meeting is compulsory'],
  ['the figures are estimates','the figures are exact measurements']
], ([fact,error]) => [
  `The source says ${fact}, but someone understood that ${error}. Correct the misunderstanding politely and preserve the source meaning.`,
  `Just to clarify, the source says ${fact}, rather than that ${error}.`,
  [`Just to clarify, the source confirms that ${error}, rather than the original statement.`,
   `I can see that the statements differ, but I would repeat the misunderstood version without checking it.`,
   `Both statements must mean exactly the same thing, so there is no misunderstanding to clarify.`],
  `“Just to clarify” softens the correction, while “rather than” distinguishes the actual source statement from the mistaken interpretation.`
]);
unit(3, 'Separating a Fact From an Interpretation', [
  ['attendance fell','the new time may be inconvenient'],
  ['help requests increased','the instructions may be unclear'],
  ['bookings rose','the publicity may have attracted attention'],
  ['the task took longer','the new steps may need practice'],
  ['fewer people returned','the follow-up message may have been missed']
], ([fact,interpretation]) => [
  `The observation is: ${fact}. The suggested explanation is: ${interpretation}. Report the observation and make clear that the explanation has not been verified.`,
  `We observed that ${fact}; one possible explanation is that ${interpretation}.`,
  [`We observed that ${fact}, which proves our proposed explanation without further investigation.`,
   `The proposed explanation is established, even though we have not checked it against other possibilities.`,
   `The observation is only an opinion, whereas our proposed explanation is a measured fact.`],
  `The response labels what was observed and qualifies the interpretation. An explanation should not be presented as a measured fact merely because it sounds plausible.`
]);
unit(3, 'Expressing Uncertainty About a Forecast', [
  ['visitor numbers','the weather'], ['delivery times','supplier capacity'],
  ['course enrolment','available funding'], ['travel demand','the new timetable'],
  ['event attendance','ticket prices']
], ([outcome,factor]) => [
  `Say that a forecast of ${outcome} is uncertain because ${factor} could change. Do not guarantee the forecast.`,
  `Our forecast of ${outcome} remains uncertain because changes in ${factor} could affect it.`,
  [`Our forecast of ${outcome} is certain, even though ${factor} could affect the outcome.`,
   `Changes in ${factor} have already been ruled out, so the forecast requires no qualification.`,
   `We have measured the final outcome rather than making a forecast, so uncertainty is irrelevant.`],
  `“Remains uncertain” states the forecast's status, and “could” identifies the unresolved factor. The alternatives remove or misrepresent that uncertainty.`
]);
unit(3, 'Entering a Discussion Constructively', [
  ['costs'], ['accessibility'], ['timing'], ['staffing'], ['testing']
], ([topic]) => [
  `The group has not discussed ${topic}. Ask for a turn to raise that relevant point, without claiming the discussion is finished.`,
  `Could I add a point about ${topic} before we reach a decision?`,
  [`I think we covered ${topic} when we discussed this last week.`,
   `Could we go over ${topic} after we have announced the final decision?`,
   `Could I restate what we have already agreed rather than add a new point?`],
  `The response asks to introduce the missing point before the decision. The alternatives refer to an earlier discussion, postpone the point until afterwards, or only repeat an agreed point.`
]);
unit(3, 'Clarifying an Ambiguous Reference', [
  ['Alex and Rina','they should submit it','Do you mean Alex, Rina, or both of them?'],
  ['the draft and the summary','revise that','Do you mean the draft or the summary?'],
  ['the morning and afternoon sessions','attend that session','Do you mean the morning or afternoon session?'],
  ['the estimate and the invoice','check this amount','Do you mean the amount in the estimate or the invoice?'],
  ['the first and second proposals','that option seems better','Do you mean the first or the second proposal?']
], ([items,reference,clarification]) => [
  `The speaker mentioned ${items}, then said ${reference}. Ask which person, item, or option the reference means rather than guessing.`,
  clarification,
  [`I will assume you mean the first one, without checking whether that was your intention.`,
   `I will act on both, even though you may have been referring to only one of them.`,
   `I heard the words clearly, so there is no need to check what the reference means.`],
  `Clarifying the referent prevents an unsupported assumption. Hearing a pronoun clearly does not guarantee knowing which person or thing it denotes.`
]);
unit(3, 'Finding Agreement and Difference', [
  ['more study space','a quiet room','a discussion room'],
  ['better travel options','more buses','more cycle routes'],
  ['clearer guidance','printed examples','short videos'],
  ['improved feedback','individual meetings','written comments'],
  ['more accessible events','lower prices','remote participation']
], ([shared,a,b]) => [
  `Two speakers both want ${shared}. One proposes ${a}; the other proposes ${b}. Summarise their shared aim and different methods.`,
  `They both want ${shared}, but one proposes ${a} and the other proposes ${b}.`,
  [`They disagree about the aim itself, although they both propose exactly the same method.`,
   `They agree on ${a}, so there is no difference between the methods they have proposed.`,
   `They have no shared aim, because proposing different methods means they disagree about everything.`],
  `The response separates the common objective from the contrasting methods. Different proposals do not necessarily mean disagreement about the aim.`
]);
unit(3, 'Prioritising a Constraint', [
  ['an affordable room','it is accessible'], ['a shorter programme','it covers the essential material'],
  ['a faster service','it maintains accuracy'], ['a digital resource','it works with assistive tools'],
  ['a larger group','everyone can receive feedback']
], ([choice,constraint]) => [
  `You prefer ${choice}, but the condition that ${constraint} takes priority. Express that priority clearly.`,
  `I'd prefer ${choice}, but only if ${constraint}; otherwise we should choose another option.`,
  [`I'd prefer ${choice}, whether or not ${constraint}, because the preference matters more.`,
   `I'd choose ${choice} first and only check the essential condition after committing to it.`,
   `The condition takes priority, so it does not need to be considered when choosing the option.`],
  `“Only if” gives the constraint priority over the preference, and the alternative clause explains what happens if the condition is not met.`
]);
unit(3, 'Reformulating Concisely', [
  ['We need to make a decision about the date','We need to decide the date', ['We have already decided the date.','We do not need to decide the date.','We need to decide the venue.']],
  ['The team carried out an investigation into the delay','The team investigated the delay', ['The team will investigate the delay.','The team caused the delay.','The team investigated the booking.']],
  ['Please provide an explanation of the change','Please explain the change', ['Please approve the change.','Please explain the original plan.','You have already explained the change.']],
  ['We will undertake a review of the plan','We will review the plan', ['We have reviewed the plan.','We will replace the plan.','They will review the plan.']],
  ['They reached an agreement on the schedule','They agreed on the schedule', ['They disagreed on the schedule.','They will agree on the schedule.','They agreed on the venue.']]
], ([original,concise,wrong]) => [
  `Rephrase this more concisely while keeping its meaning and time reference: ${original}.`,
  `${concise}.`,
  wrong,
  `The chosen rephrasing uses a direct verb while preserving the action, people involved, and time reference. The alternatives change at least one of those details.`
]);
unit(3, 'Disagreeing With a Proposal, Not a Person', [
  ['remove the help desk','some visitors need personal support'],
  ['shorten all meetings','some decisions need detailed discussion'],
  ['use only online forms','some applicants cannot get online'],
  ['cancel the pilot','we have not tested the revised version'],
  ['publish the report immediately','the figures still need checking']
], ([proposal,reason]) => [
  `For this role-play, disagree with the proposal to ${proposal}. Use this reason: ${reason}. Do not attack the proposer.`,
  `I would question the proposal to ${proposal}, because ${reason}.`,
  [`I support the proposal to ${proposal}, despite the concern that ${reason}.`,
   `Your proposal shows that you are careless; there is no need to discuss the details.`,
   `I disagree with you personally, although I do not have a reason to question the proposal.`],
  `The response evaluates the proposal and supports the assigned position with a reason. It does not judge the person's character or require the student to hold that view outside the role-play.`
]);
unit(3, 'Proposing a Conditional Compromise', [
  ['extend opening hours twice a week','review the staffing cost after a month'],
  ['offer both printed and digital guides','check which versions visitors use'],
  ['trial flexible meeting times','keep one fixed weekly check-in'],
  ['start with a smaller event','expand if the first event runs smoothly'],
  ['introduce the new system gradually','provide support during the transition']
], ([compromise,safeguard]) => [
  `Propose that we ${compromise}, on condition that we ${safeguard}. Include the compromise and safeguard.`,
  `We could ${compromise}, provided that we ${safeguard}.`,
  [`We could ${compromise}.`,
   `We should ${safeguard}, but keep the original plan rather than make that compromise.`,
   `We could ${compromise}, whether or not we ${safeguard}.`],
  `“Provided that” links the compromise to its required safeguard. A concession without the condition, or the condition without the compromise, leaves the proposed agreement incomplete.`
]);

module.exports = lessons;
