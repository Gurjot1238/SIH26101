# 2.3 Modeling with Linear Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/2-3-modeling-with-linear-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 2.3 Modeling with Linear Functions

### Learning Objectives

In this section, you will:

  * Identify steps for modeling and solving.
  * Build linear models from verbal descriptions.
  * Build systems of linear models.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/015ff43c1127452140f6aafadcfdfbd9ea9b7f7f) Figure  1 (credit: EEK Photography/Flickr)

Emily is a college student who plans to spend a summer in Seattle. She has saved $3,500 for her trip and anticipates spending $400 each week on rent, food, and activities. How can we write a linear model to represent her situation? What would be the _x_ -intercept, and what can she learn from it? To answer these and related questions, we can create a model using a linear function. Models such as this one can be extremely useful for analyzing relationships and making predictions based on those relationships. In this section, we will explore examples of linear function models.

### Identifying Steps to Model and Solve Problems

When modeling scenarios with linear functions and solving problems involving quantities with a constant rate of change, we typically follow the same problem strategies that we would use for any type of function. Let’s briefly review them:

  1. Identify changing quantities, and then define descriptive variables to represent those quantities. When appropriate, sketch a picture or define a coordinate system.
  2. Carefully read the problem to identify important information. Look for information that provides values for the variables or values for parts of the functional model, such as slope and initial value.
  3. Carefully read the problem to determine what we are trying to find, identify, solve, or interpret.
  4. Identify a solution pathway from the provided information to what we are trying to find. Often this will involve checking and tracking units, building a table, or even finding a formula for the function being used to model the problem.
  5. When needed, write a formula for the function.
  6. Solve or evaluate the function using the formula.
  7. Reflect on whether your answer is reasonable for the given situation and whether it makes sense mathematically.
  8. Clearly convey your result using appropriate units, and answer in full sentences when necessary.

### Building Linear Models

Now let’s take a look at the student in Seattle. In her situation, there are two changing quantities: time and money. The amount of money she has remaining while on vacation depends on how long she stays. We can use this information to define our variables, including units.

  * Output:  M, M, money remaining, in dollars
  * Input:  t, t, time, in weeks

So, the amount of money remaining depends on the number of weeks:  M(t) M(t)

We can also identify the initial value and the rate of change.

  * Initial Value: She saved $3,500, so $3,500 is the initial value for  M. M.
  * Rate of Change: She anticipates spending $400 each week, so –$400 per week is the rate of change, or slope.

Notice that the unit of dollars per week matches the unit of our output variable divided by our input variable. Also, because the slope is negative, the linear function is decreasing. This should make sense because she is spending money each week.

The rate of change is constant, so we can start with the linear model M( t )=mt+b. M( t )=mt+b. Then we can substitute the intercept and slope provided.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e897474b3f0c3e0a32588d7cf95898a85623d794)

To find the  x- x- intercept, we set the output to zero, and solve for the input.

0=−400t+3500 t= 3500 400 =8.75 0=−400t+3500 t= 3500 400 =8.75

The  x- x- intercept is 8.75 weeks. Because this represents the input value when the output will be zero, we could say that Emily will have no money left after 8.75 weeks.

When modeling any real-life scenario with functions, there is typically a limited domain over which that model will be valid—almost no trend continues indefinitely. Here the domain refers to the number of weeks. In this case, it doesn’t make sense to talk about input values less than zero. A negative input value could refer to a number of weeks before she saved $3,500, but the scenario discussed poses the question once she saved $3,500 because this is when her trip and subsequent spending starts. It is also likely that this model is not valid after the  x- x- intercept, unless Emily will use a credit card and goes into debt. The domain represents the set of input values, so the reasonable domain for this function is  0≤t≤8.75. 0≤t≤8.75.

In the above example, we were given a written description of the situation. We followed the steps of modeling a problem to analyze the information. However, the information provided may not always be the same. Sometimes we might be provided with an intercept. Other times we might be provided with an output value. We must be careful to analyze the information we are given, and use it appropriately to build a linear model.

#### Using a Given Intercept to Build a Model

Some real-world problems provide the  y- y- intercept, which is the constant or initial value. Once the  y- y- intercept is known, the  x- x- intercept can be calculated. Suppose, for example, that Hannah plans to pay off a no-interest loan from her parents. Her loan balance is $1,000. She plans to pay $250 per month until her balance is $0. The  y- y- intercept is the initial amount of her debt, or $1,000. The rate of change, or slope, is -$250 per month. We can then use the slope-intercept form and the given information to develop a linear model.

f(x)=mx+b =−250x+1000 f(x)=mx+b =−250x+1000

Now we can set the function equal to 0, and solve for  x x to find the  x- x- intercept.

0=−250x+1000 1000=250x 4=x x=4 0=−250x+1000 1000=250x 4=x x=4

The  x- x- intercept is the number of months it takes her to reach a balance of $0. The  x x -intercept is 4 months, so it will take Hannah four months to pay off her loan.

####  Using a Given Input and Output to Build a Model

Many real-world applications are not as direct as the ones we just considered. Instead they require us to identify some aspect of a linear function. We might sometimes instead be asked to evaluate the linear model at a given input or set the equation of the linear model equal to a specified output.

###  How To

**Given a word problem that includes two pairs of input and output values, use the linear function to solve a problem.**

  1. Identify the input and output values.
  2. Convert the data to two coordinate pairs.
  3. Find the slope.
  4. Write the linear model.
  5. Use the model to make a prediction by evaluating the function at a given  x- x- value.
  6. Use the model to identify an  x- x- value that results in a given  y- y- value.
  7. Answer the question posed.

###  Example  1

#### Using a Linear Model to Investigate a Town’s Population

A town’s population has been growing linearly. In 2004 the population was 6,200. By 2009 the population had grown to 8,100. Assume this trend continues.

  1. ⓐ Predict the population in 2013.
  2. ⓑ Identify the year in which the population will reach 15,000.

####  Solution

The two changing quantities are the population size and time. While we could use the actual year value as the input quantity, doing so tends to lead to very cumbersome equations because the  y- y- intercept would correspond to the year 0, more than 2000 years ago!

To make computation a little nicer, we will define our input as the number of years since 2004:

  * Input:  t, t, years since 2004
  * Output:  P(t), P(t), the town’s population

To predict the population in 2013  (t=9), (t=9), we would first need an equation for the population. Likewise, to find when the population would reach 15,000, we would need to solve for the input that would provide an output of 15,000. To write an equation, we need the initial value and the rate of change, or slope.

To determine the rate of change, we will use the change in output per change in input.

m= change in output change in input m= change in output change in input

The problem gives us two input-output pairs. Converting them to match our defined variables, the year 2004 would correspond to  t=0, t=0, giving the point  ( 0,6200 ). ( 0,6200 ). Notice that through our clever choice of variable definition, we have “given” ourselves the _y_ -intercept of the function. The year 2009 would correspond to  t=5, t=5, giving the point  ( 5,8100 ). ( 5,8100 ).

The two coordinate pairs are  ( 0,6200 ) ( 0,6200 ) and  ( 5,8100 ). ( 5,8100 ). Recall that we encountered examples in which we were provided two points earlier in the chapter. We can use these values to calculate the slope.

m= 8100−6200 5−0 = 1900 5 =380 people per year m= 8100−6200 5−0 = 1900 5 =380 people per year

We already know the _y_ -intercept of the line, so we can immediately write the equation:

P(t)=380t+6200 P(t)=380t+6200

To predict the population in 2013, we evaluate our function at  t=9. t=9.

P(9)=380(9)+6,200 =9,620 P(9)=380(9)+6,200 =9,620

If the trend continues, our model predicts a population of 9,620 in 2013.

To find when the population will reach 15,000, we can set  P(t)=15000 P(t)=15000 and solve for  t. t.

15000=380t+6200 8800=380t t≈23.158 15000=380t+6200 8800=380t t≈23.158

Our model predicts the population will reach 15,000 in a little more than 23 years after 2004, or somewhere around the year 2027.

###  Try It  #1

A company sells doughnuts. They incur a fixed cost of $25,000 for rent, insurance, and other expenses. It costs $0.25 to produce each doughnut.

  1. ⓐ Write a linear model to represent the cost  C C of the company as a function of  x, x, the number of doughnuts produced.
  2. ⓑ Find and interpret the _y_ -intercept.

###  Try It  #2

A city’s population has been growing linearly. In 2008, the population was 28,200. By 2012, the population was 36,800. Assume this trend continues.

  1. ⓐ Predict the population in 2014.
  2. ⓑ Identify the year in which the population will reach 54,000.

#### Using a Diagram to Model a Problem

It is useful for many real-world applications to draw a picture to gain a sense of how the variables representing the input and output may be used to answer a question. To draw the picture, first consider what the problem is asking for. Then, determine the input and the output. The diagram should relate the variables. Often, geometrical shapes or figures are drawn. Distances are often traced out. If a right triangle is sketched, the Pythagorean Theorem relates the sides. If a rectangle is sketched, labeling width and height is helpful.

###  Example  2

#### Using a Diagram to Model Distance Walked

Anna and Emanuel start at the same intersection. Anna walks east at 4 miles per hour while Emanuel walks south at 3 miles per hour. They are communicating with a two-way radio that has a range of 2 miles. How long after they start walking will they fall out of radio contact?

####  Solution

In essence, we can partially answer this question by saying they will fall out of radio contact when they are 2 miles apart, which leads us to ask a new question: 

“How long will it take them to be 2 miles apart?”

In this problem, our changing quantities are time and position, but ultimately we need to know how long will it take for them to be 2 miles apart. We can see that time will be our input variable, so we’ll define our input and output variables.

  * Input:  t, t, time in hours.
  * Output:  A(t), A(t), distance in miles, and  E(t), E(t), distance in miles

Because it is not obvious how to define our output variable, we’ll start by drawing a picture such as [Figure 2](<2-3-modeling-with-linear-functions#CNX_Precalc_Figure_02_03_003>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/430a8e6cdc0c9517dbef4e61c668774a1ee5035f) Figure  2

Initial Value: They both start at the same intersection so when t=0,t=0, the distance traveled by each person should also be 0. Thus the initial value for each is 0.

Rate of Change: Anna is walking 4 miles per hour and Emanuel is walking 3 miles per hour, which are both rates of change. The slope for AA is 4 and the slope for EE is 3.

Using those values, we can write formulas for the distance each person has walked.

A(t)=4tE(t)=3tA(t)=4tE(t)=3t

For this problem, the distances from the starting point are important. To notate these, we can define a coordinate system, identifying the “starting point” at the intersection where they both started. Then we can use the variable,  A, A, which we introduced above, to represent Anna’s position, and define it to be a measurement from the starting point in the eastward direction. Likewise, can use the variable,  E, E, to represent Emanuel’s position, measured from the starting point in the southward direction. Note that in defining the coordinate system, we specified both the starting point of the measurement and the direction of measure.

We can then define a third variable,  D, D, to be the measurement of the distance between Anna and Emanuel. Showing the variables on the diagram is often helpful, as we can see from [Figure 3](<2-3-modeling-with-linear-functions#CNX_Precalc_Figure_02_03_004>).

Recall that we need to know how long it takes for  D, D, the distance between them, to equal 2 miles. Notice that for any given input  t, t, the outputs  A( t ),E( t ), A( t ),E( t ), and  D( t ) D( t ) represent distances.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a9c89a9e6cecbcd039cf803cc6f76685a0e16308) Figure  3

[Figure 2](<2-3-modeling-with-linear-functions#CNX_Precalc_Figure_02_03_003>) shows us that we can use the Pythagorean Theorem because we have drawn a right angle.

Using the Pythagorean Theorem, we get:  

D (t) 2 =A (t) 2 +E (t) 2 = (4t) 2 + (3t) 2 =16 t 2 +9 t 2 =25 t 2 D(t)=± 25 t 2 Solve for D(t) using the square root =±5|t| D (t) 2 =A (t) 2 +E (t) 2 = (4t) 2 + (3t) 2 =16 t 2 +9 t 2 =25 t 2 D(t)=± 25 t 2 Solve for D(t) using the square root =±5|t|

In this scenario we are considering only positive values of  t, t, so our distance  D( t ) D( t ) will always be positive. We can simplify this answer to  D(t)=5t. D(t)=5t. This means that the distance between Anna and Emanuel is also a linear function. Because  D D is a linear function, we can now answer the question of when the distance between them will reach 2 miles. We will set the output  D(t)=2 D(t)=2 and solve for  t. t.

D(t)=2 5t=2 t= 2 5 =0.4 D(t)=2 5t=2 t= 2 5 =0.4

They will fall out of radio contact in 0.4 hours, or 24 minutes.

###  Q&A

**Should I draw diagrams when given information based on a geometric shape?**

_Yes. Sketch the figure and label the quantities and unknowns on the sketch._

###  Example  3

#### Using a Diagram to Model Distance between Cities

There is a straight road leading from the town of Westborough to Agritown 30 miles east and 10 miles north. Partway down this road, it junctions with a second road, perpendicular to the first, leading to the town of Eastborough. If the town of Eastborough is located 20 miles directly east of the town of Westborough, how far is the road junction from Westborough?

####  Solution

It might help here to draw a picture of the situation. See [Figure 4](<2-3-modeling-with-linear-functions#CNX_Precalc_Figure_02_03_005>). It would then be helpful to introduce a coordinate system. While we could place the origin anywhere, placing it at Westborough seems convenient. This puts Agritown at coordinates  ( 30, 10 ), ( 30, 10 ), and Eastborough at  ( 20,0 ). ( 20,0 ).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4b67aab8814a70b0803331a2e4694a204866181c) Figure  4

Using this point along with the origin, we can find the slope of the line from Westborough to Agritown:

m= 10−0 30−0 = 1 3 m= 10−0 30−0 = 1 3

The equation of the road from Westborough to Agritown would be

W(x)= 1 3 x W(x)= 1 3 x

From this, we can determine the perpendicular road to Eastborough will have slope  m=–3. m=–3. Because the town of Eastborough is at the point (20, 0), we can find the equation:

E(x)=−3x+b 0=−3(20)+b Substitute in (20, 0) b=60 E(x)=−3x+60 E(x)=−3x+b 0=−3(20)+b Substitute in (20, 0) b=60 E(x)=−3x+60

We can now find the coordinates of the junction of the roads by finding the intersection of these lines. Setting them equal,

1 3 x=−3x+60 10 3 x=60 10x=180 x=18 Substituting this back into W(x) y=W(18) = 1 3 (18) =6 1 3 x=−3x+60 10 3 x=60 10x=180 x=18 Substituting this back into W(x) y=W(18) = 1 3 (18) =6

The roads intersect at the point (18, 6). Using the distance formula, we can now find the distance from Westborough to the junction.  

distance= ( x 2 − x 1 ) 2 + ( y 2 − y 1 ) 2 = (18−0) 2 + (6−0) 2 ≈18.974 miles distance= ( x 2 − x 1 ) 2 + ( y 2 − y 1 ) 2 = (18−0) 2 + (6−0) 2 ≈18.974 miles

#### Analysis

One nice use of linear models is to take advantage of the fact that the graphs of these functions are lines. This means real-world applications discussing maps need linear functions to model the distances between reference points.

###  Try It  #3

There is a straight road leading from the town of Timpson to Ashburn 60 miles east and 12 miles north. Partway down the road, it junctions with a second road, perpendicular to the first, leading to the town of Garrison. If the town of Garrison is located 22 miles directly east of the town of Timpson, how far is the road junction from Timpson?

### Building Systems of Linear Models

Real-world situations including two or more linear functions may be modeled with a system of linear equations. Remember, when solving a system of linear equations, we are looking for points the two lines have in common. Typically, there are three types of answers possible, as shown in [Figure 5](<2-3-modeling-with-linear-functions#Figure_02_03_006>).

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/095d011ea2a456e4d1fab8156d3dc1f45bbcf6f4) Figure  5

###  How To

**Given a situation that represents a system of linear equations, write the system of equations and identify the solution.**

  1. Identify the input and output of each linear model.
  2. Identify the slope and _y_ -intercept of each linear model.
  3. Find the solution by setting the two linear functions equal to one another and solving for  x, x, or find the point of intersection on a graph.

###  Example  4

#### Building a System of Linear Models to Choose a Truck Rental Company

Jamal is choosing between two truck-rental companies. The first, Keep on Trucking, Inc., charges an up-front fee of $20, then 59 cents a mile. The second, Move It Your Way, charges an up-front fee of $16, then 63 cents a mile[4](<2-3-modeling-with-linear-functions#fs-id1165137645119>). When will Keep on Trucking, Inc. be the better choice for Jamal?

####  Solution

The two important quantities in this problem are the cost and the number of miles driven. Because we have two companies to consider, we will define two functions.

Input |  d, d, distance driven in miles  
---|---  
Outputs |  K(d): K(d): cost, in dollars, for renting from Keep on Trucking  
M( d ) M( d ) cost, in dollars, for renting from Move It Your Way  
Initial Value | Up-front fee:  K( 0 )=20 K( 0 )=20 and  M( 0 )=16 M( 0 )=16  
Rate of Change |  K(d)=$0.59 K(d)=$0.59 /mile and  P(d)=$0.63 P(d)=$0.63 /mile  
  
Table  1

A linear function is of the form  f(x)=mx+b. f(x)=mx+b. Using the rates of change and initial charges, we can write the equations

K(d)=0.59d+20 M(d)=0.63d+16 K(d)=0.59d+20 M(d)=0.63d+16

Using these equations, we can determine when Keep on Trucking, Inc., will be the better choice. Because all we have to make that decision from is the costs, we are looking for when Move It Your Way, will cost less, or when  K(d)<M(d). K(d)<M(d). The solution pathway will lead us to find the equations for the two functions, find the intersection, and then see where the  K( d ) K( d ) function is smaller.

These graphs are sketched in [Figure 6](<2-3-modeling-with-linear-functions#CNX_Precalc_Figure_02_03_007>), with  K( d ) K( d ) in blue.

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/35ee615e82f08236e6902ee0a363bacb4eafd4ef) Figure  6

To find the intersection, we set the equations equal and solve:

K(d)=M(d) 0.59d+20=0.63d+16 4=0.04d 100=d d=100 K(d)=M(d) 0.59d+20=0.63d+16 4=0.04d 100=d d=100

This tells us that the cost from the two companies will be the same if 100 miles are driven. Either by looking at the graph, or noting that  K(d)K(d) is growing at a slower rate, we can conclude that Keep on Trucking, Inc. will be the cheaper price when more than 100 miles are driven, that is  d>100. d>100.

###  Media

Access this online resource for additional instruction and practice with linear function models.

  * [Interpreting a Linear Function](<http://openstax.org/l/interpretlinear>)

###  2.3 Section Exercises

#### Verbal

[1](<chapter-2>). 

Explain how to find the input variable in a word problem that uses a linear function.

2. 

Explain how to find the output variable in a word problem that uses a linear function.

[3](<chapter-2>). 

Explain how to interpret the initial value in a word problem that uses a linear function.

4. 

Explain how to determine the slope in a word problem that uses a linear function.

#### Algebraic

[5](<chapter-2>). 

Find the area of a parallelogram bounded by the _y_ -axis, the line  x=3, x=3, the line  f(x)=1+2x, f(x)=1+2x, and the line parallel to  f(x) f(x) passing through  ( 2, 7 ). ( 2, 7 ).

6. 

Find the area of a triangle bounded by the _x_ -axis, the line  f(x)=12– 1 3 x, f(x)=12– 1 3 x, and the line perpendicular to  f(x) f(x) that passes through the origin.

[7](<chapter-2>). 

Find the area of a triangle bounded by the _y_ -axis, the line  f(x)=9– 6 7 x, f(x)=9– 6 7 x, and the line perpendicular to  f(x) f(x) that passes through the origin.

8. 

Find the area of a parallelogram bounded by the _x_ -axis, the line  g(x)=2, g(x)=2, the line  f(x)=3x, f(x)=3x, and the line parallel to  f(x) f(x) passing through  (6,1). (6,1).

For the following exercises, consider this scenario: A town’s population has been decreasing at a constant rate. In 2010 the population was 5,900. By 2012 the population had dropped 4,700. Assume this trend continues.

[9](<chapter-2>). 

Predict the population in 2016.

10. 

Identify the year in which the population will reach 0.

For the following exercises, consider this scenario: A town’s population has been increased at a constant rate. In 2010 the population was 46,020. By 2012 the population had increased to 52,070. Assume this trend continues.

[11](<chapter-2>). 

Predict the population in 2016.

12. 

Identify the year in which the population will reach 75,000.

For the following exercises, consider this scenario: A town has an initial population of 75,000. It grows at a constant rate of 2,500 per year for 5 years.

[13](<chapter-2>). 

Find the linear function that models the town’s population  P P as a function of the year,  t, t, where  t t is the number of years since the model began.

14. 

Find a reasonable domain and range for the function  P. P.

[15](<chapter-2>). 

If the function  P P is graphed, find and interpret the _x_ \- and _y_ -intercepts.

16. 

If the function  P P is graphed, find and interpret the slope of the function.

[17](<chapter-2>). 

When will the output reached 100,000?

18. 

What is the output in the year 12 years from the onset of the model?

For the following exercises, consider this scenario: The weight of a newborn is 7.5 pounds. The baby gained one-half pound a month for its first year.

[19](<chapter-2>). 

Find the linear function that models the baby’s weight  W W as a function of the age of the baby, in months,  t. t.

20. 

Find a reasonable domain and range for the function WW.

[21](<chapter-2>). 

If the function  W W is graphed, find and interpret the _x_ \- and _y_ -intercepts.

22. 

If the function _W_ is graphed, find and interpret the slope of the function.

[23](<chapter-2>). 

When did the baby weight 10.4 pounds?

24. 

What is the output when the input is 6.2? Interpret your answer.

For the following exercises, consider this scenario: The number of people afflicted with the common cold in the winter months steadily decreased by 205 each year from 2005 until 2010. In 2005, 12,025 people were afflicted.

[25](<chapter-2>). 

Find the linear function that models the number of people inflicted with the common cold  C C as a function of the year,  t. t.

26. 

Find a reasonable domain and range for the function  C. C.

[27](<chapter-2>). 

If the function  C C is graphed, find and interpret the _x_ \- and _y_ -intercepts.

28. 

If the function  C C is graphed, find and interpret the slope of the function.

[29](<chapter-2>). 

When will the output reach 0?

30. 

In what year will the number of people be 9,700?

#### Graphical

For the following exercises, use the graph in [Figure 7](<2-3-modeling-with-linear-functions#CNX_Precalc_Figure_02_03_201>), which shows the profit,  y, y, in thousands of dollars, of a company in a given year,  t, t, where  t t represents the number of years since 1980.

![Graph of a line from \(15, 150\) to \(25, 130\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/467da255a1a53b8680eb2fe9d12a460a89c1369d) Figure  7

[31](<chapter-2>). 

Find the linear function  y, y, where  y y depends on  t, t, the number of years since 1980.

32. 

Find and interpret the _y_ -intercept.

[33](<chapter-2>). 

Find and interpret the _x_ -intercept.

34. 

Find and interpret the slope.

For the following exercises, use the graph in [Figure 8](<2-3-modeling-with-linear-functions#CNX_Precalc_Figure_02_03_202>), which shows the profit,  y, y, in thousands of dollars, of a company in a given year,  t, t, where  t t represents the number of years since 1980.

![Graph of a line from \(15, 150\) to \(25, 450\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6910447826d60a85a55f51a304183f6f51be6c92) Figure  8

[35](<chapter-2>). 

Find the linear function  y, y, where  y y depends on  t, t, the number of years since 1980.

36. 

Find and interpret the _y_ -intercept.

[37](<chapter-2>). 

Find and interpret the _x_ -intercept.

38. 

Find and interpret the slope.

#### Numeric

For the following exercises, use the median home values in Mississippi and Hawaii (adjusted for inflation) shown in [Table 2](<2-3-modeling-with-linear-functions#Table_02_03_03>). Assume that the house values are changing linearly.

Year | Mississippi | Hawaii  
---|---|---  
1950 | $25,200 | $74,400  
2000 | $71,400 | $272,700  
  
Table  2

[39](<chapter-2>). 

In which state have home values increased at a higher rate?

40. 

If these trends were to continue, what would be the median home value in Mississippi in 2010?

[41](<chapter-2>). 

If we assume the linear trend existed before 1950 and continues after 2000, the two states’ median house values will be (or were) equal in what year? (The answer might be absurd.)

For the following exercises, use the median home values in Indiana and Alabama (adjusted for inflation) shown in [Table 3](<2-3-modeling-with-linear-functions#Table_02_03_04>). Assume that the house values are changing linearly.

Year | Indiana | Alabama  
---|---|---  
1950 | $37,700 | $27,100  
2000 | $94,300 | $85,100  
  
Table  3

42. 

In which state have home values increased at a higher rate?

[43](<chapter-2>). 

If these trends were to continue, what would be the median home value in Indiana in 2010?

44. 

If we assume the linear trend existed before 1950 and continues after 2000, the two states’ median house values will be (or were) equal in what year? (The answer might be absurd.)

#### Real-World Applications

[45](<chapter-2>). 

In 2004, a school population was 1,001. By 2008 the population had grown to 1,697. Assume the population is changing linearly.

  1. ⓐ How much did the population grow between the year 2004 and 2008?
  2. ⓑ How long did it take the population to grow from 1,001 students to 1,697 students?
  3. ⓒ What is the average population growth per year?
  4. ⓓ What was the population in the year 2000?
  5. ⓔ Find an equation for the population,  P, P, of the school _t_ years after 2000.
  6. ⓕ Using your equation, predict the population of the school in 2011.

46. 

In 2003, a town’s population was 1,431. By 2007 the population had grown to 2,134. Assume the population is changing linearly.

  1. ⓐ How much did the population grow between the year 2003 and 2007?
  2. ⓑ How long did it take the population to grow from 1,431 people to 2,134 people?
  3. ⓒ What is the average population growth per year?
  4. ⓓ What was the population in the year 2000?
  5. ⓔ Find an equation for the population, PP of the town tt years after 2000.
  6. ⓕ Using your equation, predict the population of the town in 2014.

[47](<chapter-2>). 

A phone company has a monthly cellular plan where a customer pays a flat monthly fee and then a certain amount of money per minute used on the phone. If a customer uses 410 minutes, the monthly cost will be $71.50. If the customer uses 720 minutes, the monthly cost will be $118.

  1. ⓐ Find a linear equation for the monthly cost of the cell plan as a function of _x_ , the number of monthly minutes used.
  2. ⓑ Interpret the slope and _y_ -intercept of the equation.
  3. ⓒ Use your equation to find the total monthly cost if 687 minutes are used.

48. 

A phone company has a monthly cellular data plan where a customer pays a flat monthly fee of $10 and then a certain amount of money per megabyte (MB) of data used on the phone. If a customer uses 20 MB, the monthly cost will be $11.20. If the customer uses 130 MB, the monthly cost will be $17.80.

  1. ⓐ Find a linear equation for the monthly cost of the data plan as a function of xx, the number of MB used.
  2. ⓑ Interpret the slope and _y_ -intercept of the equation.
  3. ⓒ Use your equation to find the total monthly cost if 250 MB are used.

[49](<chapter-2>). 

In 1991, the moose population in a park was measured to be 4,360. By 1999, the population was measured again to be 5,880. Assume the population continues to change linearly.

  1. ⓐ Find a formula for the moose population, _P_ since 1990.
  2. ⓑ What does your model predict the moose population to be in 2003?

50. 

In 2003, the owl population in a park was measured to be 340. By 2007, the population was measured again to be 285. The population changes linearly. Let the input be years since 1990.

  1. ⓐ Find a formula for the owl population, P.P. Let the input be years since 2003.
  2. ⓑ What does your model predict the owl population to be in 2012?

[51](<chapter-2>). 

The Federal Helium Reserve held about 16 billion cubic feet of helium in 2010 and is being depleted by about 2.1 billion cubic feet each year.

  1. ⓐ Give a linear equation for the remaining federal helium reserves, R,R, in terms of t,t, the number of years since 2010.
  2. ⓑ In 2015, what will the helium reserves be?
  3. ⓒ If the rate of depletion doesn’t change, in what year will the Federal Helium Reserve be depleted?

52. 

Suppose the world’s oil reserves in 2014 are 1,820 billion barrels. If, on average, the total reserves are decreasing by 25 billion barrels of oil each year:

  1. ⓐ Give a linear equation for the remaining oil reserves, R,R, in terms of t,t, the number of years since now.
  2. ⓑ Seven years from now, what will the oil reserves be?
  3. ⓒ If the rate at which the reserves are decreasing is constant, when will the world’s oil reserves be depleted?

[53](<chapter-2>). 

You are choosing between two different prepaid cell phone plans. The first plan charges a rate of 26 cents per minute. The second plan charges a monthly fee of $19.95 _plus_ 11 cents per minute. How many minutes would you have to use in a month in order for the second plan to be preferable?

54. 

You are choosing between two different window washing companies. The first charges $5 per window. The second charges a base fee of $40 plus $3 per window. How many windows would you need to have for the second company to be preferable?

[55](<chapter-2>). 

When hired at a new job selling jewelry, you are given two pay options: 

  * Option A: Base salary of $17,000 a year with a commission of 12% of your sales
  * Option B: Base salary of $20,000 a year with a commission of 5% of your sales

How much jewelry would you need to sell for option A to produce a larger income?

56. 

When hired at a new job selling electronics, you are given two pay options: 

  * Option A: Base salary of $14,000 a year with a commission of 10% of your sales
  * Option B: Base salary of $19,000 a year with a commission of 4% of your sales

How much electronics would you need to sell for option A to produce a larger income?

[57](<chapter-2>). 

When hired at a new job selling electronics, you are given two pay options: 

  * Option A: Base salary of $20,000 a year with a commission of 12% of your sales
  * Option B: Base salary of $26,000 a year with a commission of 3% of your sales

How much electronics would you need to sell for option A to produce a larger income?

58. 

When hired at a new job selling electronics, you are given two pay options: 

  * Option A: Base salary of $10,000 a year with a commission of 9% of your sales
  * Option B: Base salary of $20,000 a year with a commission of 4% of your sales

How much electronics would you need to sell for option A to produce a larger income?

### Footnotes

  * 4Rates retrieved Aug 2, 2010 from <http://www.budgettruck.com> and <http://www.uhaul.com/>

