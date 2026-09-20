# 3.1 Functions and Function Notation

> Source: College Algebra. OpenStax / Rice University.
> Official URL: https://openstax.org/books/college-algebra/pages/3-1-functions-and-function-notation
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.1 Functions and Function Notation

### Learning Objectives

In this section, you will:

  * Determine whether a relation represents a function.
  * Find the value of a function.
  * Determine whether a function is one-to-one.
  * Use the vertical line test to identify functions.
  * Graph the functions listed in the library of functions.

A jetliner changes altitude as its distance from the starting point of a flight increases. The weight of a growing child increases with time. In each case, one quantity depends on another. There is a relationship between the two quantities that we can describe, analyze, and use to make predictions. In this section, we will analyze such relationships.

### Determining Whether a Relation Represents a Function

A relation is a set of ordered pairs. The set of the first components of each ordered pair is called the **domain** and the set of the second components of each ordered pair is called the **range**. Consider the following set of ordered pairs. The first numbers in each pair are the first five natural numbers. The second number in each pair is twice that of the first.

{(1,2),(2,4),(3,6),(4,8),(5,10)} {(1,2),(2,4),(3,6),(4,8),(5,10)}

The domain is  {1,2,3,4,5}. {1,2,3,4,5}. The range is  {2,4,6,8,10}. {2,4,6,8,10}.

Note that each value in the domain is also known as an **input** value, or independent variable, and is often labeled with the lowercase letter  x.x. Each value in the range is also known as an **output** value, or dependent variable, and is often labeled lowercase letter  y.y.

A function  f f is a relation that assigns a single value in the range to each value in the domain _._ In other words, no _x_ -values are repeated. For our example that relates the first five natural numbers to numbers double their values, this relation is a function because each element in the domain,  {1,2,3,4,5}, {1,2,3,4,5}, is paired with exactly one element in the range,  {2,4,6,8,10}. {2,4,6,8,10}.

Now let’s consider the set of ordered pairs that relates the terms “even” and “odd” to the first five natural numbers. It would appear as 

{ (odd,1),(even,2),(odd,3),(even,4),(odd,5) } { (odd,1),(even,2),(odd,3),(even,4),(odd,5) }

Notice that each element in the domain,  {even,odd} {even,odd} is _not_ paired with exactly one element in the range,  {1,2,3,4,5}. {1,2,3,4,5}. For example, the term “odd” corresponds to three values from the range,  {1,3,5} {1,3,5} and the term “even” corresponds to two values from the range,  {2,4}. {2,4}. This violates the definition of a function, so this relation is not a function.

[Figure 1](<3-1-functions-and-function-notation#Figure_01_01_001>) compares relations that are functions and not functions. 

![Three relations that demonstrate what constitute a function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6b41ee83a62edd93cf9e80894490f065d2031df7) Figure  1 (a) This relationship is a function because each input is associated with a single output. Note that input  qq and  rr both give output  n. n. (b) This relationship is also a function. In this case, each input is associated with a single output. (c) This relationship is not a function because input  q q is associated with two different outputs.

###  Function

A function is a relation in which each possible input value leads to exactly one output value. We say “the output is a function of the input.”

The input values make up the domain, and the output values make up the range.

###  How To

**Given a relationship between two quantities, determine whether the relationship is a function.**

  1. Identify the input values.
  2. Identify the output values.
  3. If each input value leads to only one output value, classify the relationship as a function. If any input value leads to two or more outputs, do not classify the relationship as a function.

###  Example  1

#### Determining If Menu Price Lists Are Functions

The coffee shop menu, shown below, consists of items and their prices.  
ⓐ Is price a function of the item?  
ⓑ Is the item a function of the price? 

![A menu of donut prices from a coffee shop where a plain donut is $1.49 and a jelly donut and chocolate donut are $1.99.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/891ac2bd18a398c550f2aae376fe76fe5b13d4d4)

####  Solution

ⓐ Let’s begin by considering the input as the items on the menu. The output values are then the prices. 

![A menu of donut prices from a coffee shop where a plain donut is $1.49 and a jelly donut and chocolate donut are $1.99.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fb8854bea4c2687291cdc81c609909bada5f3c07)

Each item on the menu has only one price, so the price is a function of the item.   
ⓑ Two items on the menu have the same price. If we consider the prices to be the input values and the items to be the output, then the same input value could have more than one output associated with it. See the image below.  

![Association of the prices to the donuts.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4ca8a33070cb29d5a0d84af71c52fecedce72117)

  
Therefore, the item is a not a function of price. 

###  Example  2

#### Determining If Class Grade Rules Are Functions

In a particular math class, the overall percent grade corresponds to a grade point average. Is grade point average a function of the percent grade? Is the percent grade a function of the grade point average? [Table 1](<3-1-functions-and-function-notation#Table_01_01_01>) shows a possible rule for assigning grade points.

**Percent grade** | 0–56 | 57–61 | 62–66 | 67–71 | 72–77 | 78–86 | 87–91 | 92–100  
---|---|---|---|---|---|---|---|---  
**Grade point average** | 0.0 | 1.0 | 1.5 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0  
  
Table  1

####  Solution

For any percent grade earned, there is an associated grade point average, so the grade point average is a function of the percent grade. In other words, if we input the percent grade, the output is a specific grade point average. 

In the grading system given, there is a range of percent grades that correspond to the same grade point average. For example, students who receive a grade point average of 3.0 could have a variety of percent grades ranging from 78 all the way to 86. Thus, percent grade is not a function of grade point average.

###  Try It  #1

[Table 2](<3-1-functions-and-function-notation#Table_01_01_02>)[1](<3-1-functions-and-function-notation#fs-id1165135255104>) lists the five greatest baseball players of all time in order of rank.

Player | Rank  
---|---  
Babe Ruth | 1  
Willie Mays | 2  
Ty Cobb | 3  
Walter Johnson | 4  
Hank Aaron | 5  
  
Table  2

  1. ⓐIs the rank a function of the player name?
  2. ⓑIs the player name a function of the rank?

#### Using Function Notation

Once we determine that a relationship is a function, we need to display and define the functional relationships so that we can understand and use them, and sometimes also so that we can program them into computers. There are various ways of representing functions. A standard function notation is one representation that facilitates working with functions.

To represent “height is a function of age,” we start by identifying the descriptive variables  h h for height and  a a for age. The letters  f,g, f,g, and  h h are often used to represent functions just as we use  x,y, x,y, and  z z to represent numbers and  A,B, A,B, and  C C to represent sets. 

his fof a We name the function f;height is a function of age. h=f(a) We use parentheses to indicate the function input.  f(a) We name the function f;the expression is read as “fof a.” his fof a We name the function f;height is a function of age. h=f(a) We use parentheses to indicate the function input.  f(a) We name the function f;the expression is read as “fof a.”

Remember, we can use any letter to name the function; the notation  h( a )h( a ) shows us that  hh depends on  a. a. The value  aa must be put into the function  hh to get a result. The parentheses indicate that age is input into the function; they do not indicate multiplication.

We can also give an algebraic expression as the input to a function. For example  f( a+b )f( a+b ) means “first add _a_ and _b_ , and the result is the input for the function _f_.” The operations must be performed in this order to obtain the correct result.

###  Function Notation

The notation  y=f( x )y=f( x ) defines a function named  f. f. This is read as  “y“y is a function of  x.” x.” The letter  x x represents the input value, or independent variable. The letter  y,  y,  or  f( x ),f( x ), represents the output value, or dependent variable. 

###  Example  3

#### Using Function Notation for Days in a Month

Use function notation to represent a function whose input is the name of a month and output is the number of days in that month. Assume that the domain does not include leap years.

####  Solution

The number of days in a month is a function of the name of the month, so if we name the function  f, f, we write  days=f(month) days=f(month) or  d=f(m). d=f(m). The name of the month is the input to a “rule” that associates a specific number (the output) with each input.

![The function 31 = f\(January\) where 31 is the output, f is the rule, and January is the input.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/debe52c37e0c953a4c0fa61977b6c12ed9c012bd) Figure  2

For example,  f( March )=31, f( March )=31, because March has 31 days. The notation  d=f( m ) d=f( m ) reminds us that the number of days,  d d (the output), is dependent on the name of the month,  m m (the input). 

#### Analysis 

Note that the inputs to a function do not have to be numbers; function inputs can be names of people, labels of geometric objects, or any other element that determines some kind of output. However, most of the functions we will work with in this book will have numbers as inputs and outputs.

###  Example  4

#### Interpreting Function Notation 

A function  N=f( y )N=f( y ) gives the number of police officers,  N, N, in a town in year  y. y. What does  f( 2005 )=300f( 2005 )=300 represent?

####  Solution

When we read  f( 2005 )=300,f( 2005 )=300, we see that the input year is 2005. The value for the output, the number of police officers  ( N ),( N ), is 300. Remember,  N=f( y ).N=f( y ). The statement  f( 2005 )=300f( 2005 )=300 tells us that in the year 2005 there were 300 police officers in the town.

###  Try It  #2

Use function notation to express the weight of a pig in pounds as a function of its age in days  d.d.

###  Q&A

**Instead of a notation such as y=f(x), y=f(x), could we use the same symbol for the output as for the function, such as  y=y(x), y=y(x), meaning “ _y_ is a function of _x_?”**

 _Yes, this is often done, especially in applied subjects that use higher math, such as physics and engineering. However, in exploring math itself we like to maintain a distinction between a function such as f, f, which is a rule or procedure, and the output  yy we get by applying  ff to a particular input  x. x. This is why we usually use notation such as  y=f( x ),P=W( d ), y=f( x ),P=W( d ), and so on._

#### Representing Functions Using Tables

A common method of representing functions is in the form of a table. The table rows or columns display the corresponding input and output values. In some cases, these values represent all we know about the relationship; other times, the table provides a few select examples from a more complete relationship.

[Table 3](<3-1-functions-and-function-notation#Table_01_01_03>) lists the input number of each month (January = 1, February = 2, and so on) and the output value of the number of days in that month. This information represents all we know about the months and days for a given year (that is not a leap year). Note that, in this table, we define a days-in-a-month function  ff where  D=f( m )D=f( m ) identifies months by an integer rather than by name.

**Month number, m m (input)** | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12  
---|---|---|---|---|---|---|---|---|---|---|---|---  
**Days in month, D D (output)** | 31 | 28 | 31 | 30 | 31 | 30 | 31 | 31 | 30 | 31 | 30 | 31  
  
Table  3

[Table 4](<3-1-functions-and-function-notation#Table_01_01_04>) defines a function  Q=g( n ).Q=g( n ). Remember, this notation tells us that  gg is the name of the function that takes the input  nn and gives the output  Q .Q .

n n | 1 | 2 | 3 | 4 | 5  
---|---|---|---|---|---  
Q Q | 8 | 6 | 7 | 6 | 8  
  
Table  4

[Table 5](<3-1-functions-and-function-notation#Table_01_01_05>) displays the age of children in years and their corresponding heights. This table displays just some of the data available for the heights and ages of children. We can see right away that this table does not represent a function because the same input value, 5 years, has two different output values, 40 in. and 42 in.

**Age in years, a a (input)** | 5 | 5 | 6 | 7 | 8 | 9 | 10  
---|---|---|---|---|---|---|---  
**Height in inches, h h (output)** | 40 | 42 | 44 | 47 | 50 | 52 | 54  
  
Table  5

###  How To

**Given a table of input and output values, determine whether the table represents a function.**

  1. Identify the input and output values.
  2. Check to see if each input value is paired with only one output value. If so, the table represents a function.

###  Example  5

#### Identifying Tables that Represent Functions

Which table, [Table 6](<3-1-functions-and-function-notation#Table_01_01_06>), [Table 7](<3-1-functions-and-function-notation#Table_01_01_07>), or [Table 8](<3-1-functions-and-function-notation#Table_01_01_08>), represents a function (if any)?

Input | Output  
---|---  
2 | 1  
5 | 3  
8 | 6  
  
Table  6

Input | Output  
---|---  
–3 | 5  
0 | 1  
4 | 5  
  
Table  7

Input | Output  
---|---  
1 | 0  
5 | 2  
5 | 4  
  
Table  8

####  Solution

[Table 6](<3-1-functions-and-function-notation#Table_01_01_06>) and [Table 7](<3-1-functions-and-function-notation#Table_01_01_07>) define functions. In both, each input value corresponds to exactly one output value. [Table 8](<3-1-functions-and-function-notation#Table_01_01_08>) does not define a function because the input value of 5 corresponds to two different output values.

When a table represents a function, corresponding input and output values can also be specified using function notation.

The function represented by [Table 6](<3-1-functions-and-function-notation#Table_01_01_06>) can be represented by writing

f(2)=1,f(5)=3,and f(8)=6 f(2)=1,f(5)=3,and f(8)=6

Similarly, the statements 

g( −3 )=5,g( 0 )=1,and g( 4 )=5 g( −3 )=5,g( 0 )=1,and g( 4 )=5

represent the function in [Table 7](<3-1-functions-and-function-notation#Table_01_01_07>).

[Table 8](<3-1-functions-and-function-notation#Table_01_01_08>) cannot be expressed in a similar way because it does not represent a function.

###  Try It  #3

Does [Table 9](<3-1-functions-and-function-notation#Table_01_01_09>) represent a function? 

Input | Output  
---|---  
1 | 10  
2 | 100  
3 | 1000  
  
Table  9

### Finding Input and Output Values of a Function 

When we know an input value and want to determine the corresponding output value for a function, we _evaluate_ the function. Evaluating will always produce one result because each input value of a function corresponds to exactly one output value.

When we know an output value and want to determine the input values that would produce that output value, we set the output equal to the function’s formula and _solve_ for the input. Solving can produce more than one solution because different input values can produce the same output value.

#### Evaluation of Functions in Algebraic Forms

When we have a function in formula form, it is usually a simple matter to evaluate the function. For example, the function  f( x )=5−3 x 2 f( x )=5−3 x 2 can be evaluated by squaring the input value, multiplying by 3, and then subtracting the product from 5.

###  How To

**Given the formula for a function, evaluate.**

  1. Substitute the input variable in the formula with the value provided.
  2. Calculate the result.

###  Example  6

#### Evaluating Functions at Specific Values

Evaluate  f( x )= x 2 +3x−4f( x )= x 2 +3x−4 at:

  1. ⓐ 2 2
  2. ⓑ a a
  3. ⓒ a+h a+h
  4. ⓓ Now evaluate  f( a+h )−f( a ) h f( a+h )−f( a ) h

####  Solution

Replace the  x x in the function with each specified value.

  1. ⓐ Because the input value is a number, 2, we can use simple algebra to simplify. 

f( 2 )= 2 2 +3( 2 )−4 =4+6−4 =6 f( 2 )= 2 2 +3( 2 )−4 =4+6−4 =6

  2. ⓑ In this case, the input value is a letter so we cannot simplify the answer any further. 

f( a )= a 2 +3a−4 f( a )= a 2 +3a−4

  3. With an input value of  a+h, a+h, we must use the distributive property. 

f(a+h)= (a+h) 2 +3(a+h)−4 = a 2 +2ah+ h 2 +3a+3h−4 f(a+h)= (a+h) 2 +3(a+h)−4 = a 2 +2ah+ h 2 +3a+3h−4

  4. ⓒ In this case, we apply the input values to the function more than once, and then perform algebraic operations on the result. We already found that 

f( a+h )= a 2 +2ah+ h 2 +3a+3h−4 f( a+h )= a 2 +2ah+ h 2 +3a+3h−4

and we know that

f( a )= a 2 +3a−4 f( a )= a 2 +3a−4

Now we combine the results and simplify.

f(a+h)−f(a) h = ( a 2 +2ah+ h 2 +3a+3h−4)−( a 2 +3a−4) h = 2ah+ h 2 +3h h = h(2a+h+3) h Factor out h. =2a+h+3 Simplify. f(a+h)−f(a) h = ( a 2 +2ah+ h 2 +3a+3h−4)−( a 2 +3a−4) h = 2ah+ h 2 +3h h = h(2a+h+3) h Factor out h. =2a+h+3 Simplify.

###  Example  7

#### Evaluating Functions

Given the function  h( p )= p 2 +2p,h( p )= p 2 +2p, evaluate  h( 4 ).h( 4 ).

####  Solution

To evaluate  h( 4 ),h( 4 ), we substitute the value 4 for the input variable  pp in the given function.

h(p)= p 2 +2p h(4)= (4) 2 +2(4) =16+8 =24 h(p)= p 2 +2p h(4)= (4) 2 +2(4) =16+8 =24

Therefore, for an input of 4, we have an output of 24.

###  Try It  #4

Given the function  g( m )= m−4 ,g( m )= m−4 , evaluate  g( 5 ).g( 5 ).

###  Example  8

#### Solving Functions

Given the function  h( p )= p 2 +2p,h( p )= p 2 +2p, solve for  h( p )=3.h( p )=3.

####  Solution

h(p)=3 p 2 +2p=3 Substitute the original function h(p)= p 2 +2p. p 2 +2p−3=0 Subtract 3 from each side. (p+3)(p−1)=0 Factor. h(p)=3 p 2 +2p=3 Substitute the original function h(p)= p 2 +2p. p 2 +2p−3=0 Subtract 3 from each side. (p+3)(p−1)=0 Factor.

If  ( p+3 )( p−1 )=0,( p+3 )( p−1 )=0, either  ( p+3 )=0( p+3 )=0 or  ( p−1 )=0( p−1 )=0 (or both of them equal 0). We will set each factor equal to 0 and solve for  pp in each case.

(p+3)=0, p=−3 (p−1)=0, p=1 (p+3)=0, p=−3 (p−1)=0, p=1

This gives us two solutions. The output  h( p )=3h( p )=3 when the input is either  p=1p=1 or  p=−3.p=−3. We can also verify by graphing as in [Figure 3](<3-1-functions-and-function-notation#Figure_01_01_006>). The graph verifies that  h( 1 )=h( −3 )=3h( 1 )=h( −3 )=3 and  h( 4 )=24.h( 4 )=24.

![Graph of a parabola with labeled points \(-3, 3\), \(1, 3\), and \(4, 24\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3b25ce7f4057d0b6de4522c8628da38b145d5b60) Figure  3

###  Try It  #5

Given the function  g( m )= m−4 ,g( m )= m−4 , solve  g( m )=2.g( m )=2.

#### Evaluating Functions Expressed in Formulas

Some functions are defined by mathematical rules or procedures expressed in equation form. If it is possible to express the function output with a formula involving the input quantity, then we can define a function in algebraic form. For example, the equation  2n+6p=122n+6p=12 expresses a functional relationship between  nn and  p. p. We can rewrite it to decide if  pp is a function of  n. n.

###  How To

**Given a function in equation form, write its algebraic formula.**

  1. Solve the equation to isolate the output variable on one side of the equal sign, with the other side as an expression that involves _only_ the input variable.
  2. Use all the usual algebraic methods for solving equations, such as adding or subtracting the same quantity to or from both sides, or multiplying or dividing both sides of the equation by the same quantity.

###  Example  9

#### Finding an Equation of a Function

Express the relationship  2n+6p=122n+6p=12 as a function  p=f( n ),p=f( n ), if possible.

####  Solution

To express the relationship in this form, we need to be able to write the relationship where  pp is a function of  n, n, which means writing it as  p=[expressioninvolvingn].p=[expressioninvolvingn].

2n+6p=12 6p=12−2n Subtract 2nfrom both sides. p= 12−2n 6 Divide both sides by 6 and simplify. p= 12 6 − 2n 6 p=2− 1 3 n 2n+6p=12 6p=12−2n Subtract 2nfrom both sides. p= 12−2n 6 Divide both sides by 6 and simplify. p= 12 6 − 2n 6 p=2− 1 3 n

Therefore,  pp as a function of  nn is written as

p=f( n )=2− 1 3 n p=f( n )=2− 1 3 n

#### Analysis 

It is important to note that not every relationship expressed by an equation can also be expressed as a function with a formula.

###  Example  10

#### Expressing the Equation of a Circle as a Function

Does the equation  x 2 + y 2 =1 x 2 + y 2 =1 represent a function with  xx as input and  yy as output? If so, express the relationship as a function  y=f( x ).y=f( x ).

####  Solution

First we subtract  x 2 x 2 from both sides.

y 2 =1− x 2 y 2 =1− x 2

We now try to solve for  yy in this equation.

y=± 1− x 2 =+ 1− x 2 and − 1− x 2 y=± 1− x 2 =+ 1− x 2 and − 1− x 2

We get two outputs corresponding to the same input, so this relationship cannot be represented as a single function  y=f( x ).y=f( x ).

###  Try It  #6

If  x−8 y 3 =0,x−8 y 3 =0, express  yy as a function of  x. x.

###  Q&A

**Are there relationships expressed by an equation that do represent a function but which still cannot be represented by an algebraic formula?**

_Yes, this can happen. For example, given the equation x=y+ 2 y ,x=y+ 2 y , if we want to express  yy as a function of  x,x, there is no simple algebraic formula involving only  xx that equals  y.y. However, each  xx does determine a unique value for  y,y, and there are mathematical procedures by which  yy can be found to any desired accuracy. In this case, we say that the equation gives an implicit (implied) rule for  yy as a function of  x,x, even though the formula cannot be written explicitly._

#### Evaluating a Function Given in Tabular Form

As we saw above, we can represent functions in tables. Conversely, we can use information in tables to write functions, and we can evaluate functions using the tables. For example, how well do our pets recall the fond memories we share with them? There is an urban legend that a goldfish has a memory of 3 seconds, but this is just a myth. Goldfish can remember up to 3 months, while the beta fish has a memory of up to 5 months. And while a puppy’s memory span is no longer than 30 seconds, the adult dog can remember for 5 minutes. This is meager compared to a cat, whose memory span lasts for 16 hours.

The function that relates the type of pet to the duration of its memory span is more easily visualized with the use of a table. See [Table 10](<3-1-functions-and-function-notation#Table_01_01_10>).[2](<3-1-functions-and-function-notation#fs-id1165135434830>)

Pet | Memory span in hours  
---|---  
Puppy | 0.008  
Adult dog  | 0.083  
Cat | 16  
Goldfish | 2160  
Beta fish | 3600  
  
Table  10

At times, evaluating a function in table form may be more useful than using equations.Here let us call the function  P. P. The domain of the function is the type of pet and the range is a real number representing the number of hours the pet’s memory span lasts. We can evaluate the function  PP at the input value of “goldfish.” We would write  P(goldfish)=2160. P(goldfish)=2160. Notice that, to evaluate the function in table form, we identify the input value and the corresponding output value from the pertinent row of the table. The tabular form for function  PP seems ideally suited to this function, more so than writing it in paragraph or function form.

###  How To

**Given a function represented by a table, identify specific output and input values.**

  1. Find the given input in the row (or column) of input values.
  2. Identify the corresponding output value paired with that input value.
  3. Find the given output values in the row (or column) of output values, noting every time that output value appears.
  4. Identify the input value(s) corresponding to the given output value.

###  Example  11

#### Evaluating and Solving a Tabular Function

Using [Table 11](<3-1-functions-and-function-notation#Table_01_01_11>),  
ⓐ Evaluate  g( 3 ). g( 3 ).   
ⓑ Solve  g( n )=6. g( n )=6.   

** n n ** | 1 | 2 | 3 | 4 | 5  
---|---|---|---|---|---  
** g( n ) g( n ) ** | 8 | 6 | 7 | 6 | 8  
  
Table  11

####  Solution

ⓐ Evaluating  g(3) g(3) means determining the output value of the function  g g for the input value of  n=3. n=3. The table output value corresponding to  n=3 n=3 is 7, so  g(3)=7. g(3)=7.   
ⓑ Solving  g(n)=6 g(n)=6 means identifying the input values,  n, n, that produce an output value of 6. [Table 11](<3-1-functions-and-function-notation#Table_01_01_11>) shows two solutions:  2 2 and  4. 4.

** n n ** | 1 | 2 | 3 | 4 | 5  
---|---|---|---|---|---  
** g( n ) g( n ) ** | 8 | 6 | 7 | 6 | 8  
  
When we input 2 into the function  g,g, our output is 6. When we input 4 into the function  g,g, our output is also 6.

###  Try It  #7

Using [[link]](<3-1-functions-and-function-notation#Table_01_01_12>), evaluate  g( 1 ). g( 1 ).

#### Finding Function Values from a Graph 

Evaluating a function using a graph also requires finding the corresponding output value for a given input value, only in this case, we find the output value by looking at the graph. Solving a function equation using a graph requires finding all instances of the given output value on the graph and observing the corresponding input value(s).

###  Example  12

#### Reading Function Values from a Graph 

Given the graph in [Figure 4](<3-1-functions-and-function-notation#Figure_01_01_007>),

ⓐ Evaluate  f( 2 ).f( 2 ).   
ⓑ Solve  f( x )=4. f( x )=4.

![Graph of a positive parabola centered at \(1, 0\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d9d5535a8ae423f5f6ee0c6394d0a5354540a973) Figure  4

####  Solution

ⓐ To evaluate  f( 2 ), f( 2 ), locate the point on the curve where  x=2, x=2, then read the _y_ -coordinate of that point. The point has coordinates  (2,1), (2,1), so  f( 2 )=1. f( 2 )=1. See [Figure 5](<3-1-functions-and-function-notation#Figure_01_01_008>). 

![Graph of a positive parabola centered at \(1, 0\) with the labeled point \(2, 1\) where f\(2\) =1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8cf1d70feb04bd7ed0980e58c9e8bc3ddb07b658) Figure  5

  
ⓑ To solve  f( x )=4,f( x )=4, we find the output value  4 4 on the vertical axis. Moving horizontally along the line  y=4,y=4, we locate two points of the curve with output value  4: 4: (−1,4) (−1,4) and  (3,4). (3,4). These points represent the two solutions to  f( x )=4: f( x )=4: −1 −1 or  3. 3. This means  f( −1 )=4 f( −1 )=4 and  f( 3 )=4, f( 3 )=4, or when the input is  −1−1 or  3, 3, the output is  4. 4. See [Figure 6](<3-1-functions-and-function-notation#Figure_01_01_009>). 

![Graph of an upward-facing parabola with a vertex at \(0,1\) and labeled points at \(-1, 4\) and \(3,4\). A line at y = 4 intersects the parabola at the labeled points.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f6952dad79c1aae3f0c99faaff31c359b4b5acfb) Figure  6

###  Try It  #8

Using [Figure 4](<3-1-functions-and-function-notation#Figure_01_01_007>), solve  f( x )=1. f( x )=1.

### Determining Whether a Function is One-to-One 

Some functions have a given output value that corresponds to two or more input values. For example, in the stock chart shown in the figure at the beginning of this chapter, the stock price was $1000 on five different dates, meaning that there were five different input values that all resulted in the same output value of $1000.

However, some functions have only one input value for each output value, as well as having only one output for each input. We call these functions one-to-one functions. As an example, consider a school that uses only letter grades and decimal equivalents, as listed in [Table 12](<3-1-functions-and-function-notation#Table_01_01_13>).

Letter grade | Grade point average  
---|---  
A | 4.0  
B | 3.0  
C | 2.0  
D | 1.0  
  
Table  12

This grading system represents a one-to-one function, because each letter input yields one particular grade point average output and each grade point average corresponds to one input letter.

To visualize this concept, let’s look again at the two simple functions sketched in [Figure 1](<3-1-functions-and-function-notation#Figure_01_01_001>)**(a)** and [Figure 1](<3-1-functions-and-function-notation#Figure_01_01_001>)**(b)**. The function in part (a) shows a relationship that is not a one-to-one function because inputs  qq and  rr both give output  n.n. The function in part (b) shows a relationship that is a one-to-one function because each input is associated with a single output.

###  One-to-One Function

A one-to-one function is a function in which each output value corresponds to exactly one input value.

###  Example  13

#### Determining Whether a Relationship Is a One-to-One Function 

Is the area of a circle a function of its radius? If yes, is the function one-to-one?

####  Solution

A circle of radius  r r has a unique area measure given by  A=π r 2 , A=π r 2 , so for any input,  r, r, there is only one output, A.A. The area is a function of radius  r. r.

If the function is one-to-one, the output value, the area, must correspond to a unique input value, the radius. Any area measure  A A is given by the formula  A=π r 2 . A=π r 2 . Because areas and radii are positive numbers, there is exactly one solution:  A π . A π . So the area of a circle is a one-to-one function of the circle’s radius.

###  Try It  #9

  1. ⓐ Is a balance a function of the bank account number?
  2. ⓑ Is a bank account number a function of the balance?
  3. ⓒ Is a balance a one-to-one function of the bank account number?

###  Try It  #10

Evaluate the following:

  1. ⓐ If each percent grade earned in a course translates to one letter grade, is the letter grade a function of the percent grade?
  2. ⓑ If so, is the function one-to-one?

### Using the Vertical Line Test

As we have seen in some examples above, we can represent a function using a graph. Graphs display a great many input-output pairs in a small space. The visual information they provide often makes relationships easier to understand. By convention, graphs are typically constructed with the input values along the horizontal axis and the output values along the vertical axis.

The most common graphs name the input value  xx and the output value  y,y, and we say  yy is a function of  x,x, or  y=f( x )y=f( x ) when the function is named  f.f. The graph of the function is the set of all points  (x,y)(x,y) in the plane that satisfies the equation  y=f( x ). y=f( x ). If the function is defined for only a few input values, then the graph of the function is only a few points, where the _x_ -coordinate of each point is an input value and the _y_ -coordinate of each point is the corresponding output value. For example, the black dots on the graph in [Figure 7](<3-1-functions-and-function-notation#Figure_01_01_011>) tell us that  f( 0 )=2f( 0 )=2 and  f( 6 )=1.f( 6 )=1. However, the set of all points  (x,y)(x,y) satisfying  y=f( x )y=f( x ) is a curve. The curve shown includes  (0,2)(0,2) and  (6,1)(6,1) because the curve passes through those points.

![Graph of a polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e40225f928196cc283620b5b3be627c779e39e88) Figure  7

The vertical line test can be used to determine whether a graph represents a function. If we can draw any vertical line that intersects a graph more than once, then the graph does _not_ define a function because a function has only one output value for each input value. See [Figure 8](<3-1-functions-and-function-notation#Figure_01_01_012>).

![Three graphs visually showing what is and is not a function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5de44094c80844ac528be8d8c90e340efe4690e9) Figure  8

###  How To

**Given a graph, use the vertical line test to determine if the graph represents a function.**

  1. Inspect the graph to see if any vertical line drawn would intersect the curve more than once.
  2. If there is any such line, determine that the graph does not represent a function.

###  Example  14

#### Applying the Vertical Line Test

Which of the graphs in [Figure 9](<3-1-functions-and-function-notation#Figure_01_01_013>) represent(s) a function  y=f( x )? y=f( x )?

![Graph of a polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e8fec0cea602e1340888f47cb62b358bac7c68b4) Figure  9

####  Solution

If any vertical line intersects a graph more than once, the relation represented by the graph is not a function. Notice that any vertical line would pass through only one point of the two graphs shown in parts (a) and (b) of [Figure 9](<3-1-functions-and-function-notation#Figure_01_01_013>). From this we can conclude that these two graphs represent functions. The third graph does not represent a function because, at most _x_ -values, a vertical line would intersect the graph at more than one point, as shown in [Figure 10](<3-1-functions-and-function-notation#Figure_01_01_016>).

![Graph of a circle.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4f55692043ccebf4409fbd35370e2d0aa41230cd) Figure  10

###  Try It  #11

Does the graph in [Figure 11](<3-1-functions-and-function-notation#Figure_01_01_017>) represent a function?

![Graph of absolute value function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/87d8239f0e33ffefdd05637650de6dec7d282776) Figure  11

###  Using the Horizontal Line Test

Once we have determined that a graph defines a function, an easy way to determine if it is a one-to-one function is to use the horizontal line test. Draw horizontal lines through the graph. If any horizontal line intersects the graph more than once, then the graph does not represent a one-to-one function.

###  How To

**Given a graph of a function, use the horizontal line test to determine if the graph represents a one-to-one function.**

  1. Inspect the graph to see if any horizontal line drawn would intersect the curve more than once.
  2. If there is any such line, determine that the function is not one-to-one.

###  Example  15

#### Applying the Horizontal Line Test

Consider the functions shown in [Figure 9](<3-1-functions-and-function-notation#Figure_01_01_013>)**(a)** and [Figure 9](<3-1-functions-and-function-notation#Figure_01_01_013>)**(b)**. Are either of the functions one-to-one?

####  Solution

The function in [Figure 9](<3-1-functions-and-function-notation#Figure_01_01_013>)**(a)** is not one-to-one. The horizontal line shown in [Figure 12](<3-1-functions-and-function-notation#Figure_01_01_010>) intersects the graph of the function at two points (and we can even find horizontal lines that intersect it at three points.)

![](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/84bf0c6b15747c2861d8ebc10ded779fae1be7d6) Figure  12

The function in [Figure 9](<3-1-functions-and-function-notation#Figure_01_01_013>)**(b)** is one-to-one. Any horizontal line will intersect a diagonal line at most once.

###  Try It  #12

Is the graph shown in [Figure 9](<3-1-functions-and-function-notation#Figure_01_01_013>) one-to-one?

### Identifying Basic Toolkit Functions

In this text, we will be exploring functions—the shapes of their graphs, their unique characteristics, their algebraic formulas, and how to solve problems with them. When learning to read, we start with the alphabet. When learning to do arithmetic, we start with numbers. When working with functions, it is similarly helpful to have a base set of building-block elements. We call these our “toolkit functions,” which form a set of basic named functions for which we know the graph, formula, and special properties. Some of these functions are programmed to individual buttons on many calculators. For these definitions we will use  xx as the input variable and  y=f( x )y=f( x ) as the output variable.

We will see these toolkit functions, combinations of toolkit functions, their graphs, and their transformations frequently throughout this book. It will be very helpful if we can recognize these toolkit functions and their features quickly by name, formula, graph, and basic table properties. The graphs and sample table values are included with each function shown in [Table 13](<3-1-functions-and-function-notation#Table_01_01_14>).

Toolkit Functions  
---  
Name | Function | Graph  
Constant |  f( x )=c, f( x )=c, where  c c is a constant  |  ![Graph of a constant function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9c1ee4c9293c1b3181bd325bc335133b4147e9c7)  
Identity |  f( x )=x f( x )=x |  ![Graph of a straight line.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d19290f0ffcaf2b8ee3c401663172ee7ea38382c)  
Absolute value |  f( x )=| x | f( x )=| x | |  ![Graph of absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7036b365df413ae903b48eda30dfef5a25ae8e84)  
Quadratic |  f( x )= x 2 f( x )= x 2 |  ![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a0a40cb9f1c5bb1eee225aa3f0775bb7fc382eea)  
Cubic |  f( x )= x 3 f( x )= x 3 |  ![Graph of f\(x\) = x^3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4a17f0dce29704efc67de012a2bd1eaf3df420ce)  
Reciprocal |  f( x )= 1 x f( x )= 1 x |  ![Graph of f\(x\)=1/x.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/24f9223b1c60deb4e8818574fea12e3b7668a99c)  
Reciprocal squared |  f( x )= 1 x 2 f( x )= 1 x 2 |  ![Graph of f\(x\)=1/x^2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1577932032b4878c345dfa17221136ec5a31c42c)  
Square root |  f( x )= x f( x )= x |  ![Graph of f\(x\)=sqrt\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/35ba12351df8204766c453f47219e3f8e7947e5a)  
Cube root |  f( x )= x 3 f( x )= x 3 |  ![Graph of f\(x\)=x^\(1/3\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/87dcefd2385fffb377b07cbcb205598a84b5bde5)  
  
Table  13

###  Media

Access the following online resources for additional instruction and practice with functions.

  * [Determine if a Relation is a Function](<http://openstax.org/l/relationfunction>)
  * [Vertical Line Test](<http://openstax.org/l/vertlinetest>)
  * [Introduction to Functions](<http://openstax.org/l/introtofunction>)
  * [Vertical Line Test on Graph](<http://openstax.org/l/vertlinegraph>)
  * [One-to-one Functions](<http://openstax.org/l/onetoone>)
  * [Graphs as One-to-one Functions](<http://openstax.org/l/graphonetoone>)

###  3.1 Section Exercises

#### Verbal

[1](<chapter-3>). 

What is the difference between a relation and a function?

2. 

What is the difference between the input and the output of a function?

[3](<chapter-3>). 

Why does the vertical line test tell us whether the graph of a relation represents a function?

4. 

How can you determine if a relation is a one-to-one function?

[5](<chapter-3>). 

Why does the horizontal line test tell us whether the graph of a function is one-to-one?

#### Algebraic

For the following exercises, determine whether the relation represents a function.

6. 

{ ( a,b ),( c,d ),( a,c ) } { ( a,b ),( c,d ),( a,c ) }

[7](<chapter-3>). 

{(a,b),(b,c),(c,c)} {(a,b),(b,c),(c,c)}

For the following exercises, determine whether the relation represents  yy as a function of  x. x.

8. 

5x+2y=10 5x+2y=10

[9](<chapter-3>). 

y= x 2 y= x 2

10. 

x= y 2 x= y 2

[11](<chapter-3>). 

3 x 2 +y=14 3 x 2 +y=14

12. 

2x+ y 2 =6 2x+ y 2 =6

[13](<chapter-3>). 

y=−2 x 2 +40x y=−2 x 2 +40x

14. 

y= 1 x y= 1 x

[15](<chapter-3>). 

x= 3y+5 7y−1 x= 3y+5 7y−1

16. 

x= 1− y 2 x= 1− y 2

[17](<chapter-3>). 

y= 3x+5 7x−1 y= 3x+5 7x−1

18. 

x 2 + y 2 =9 x 2 + y 2 =9

[19](<chapter-3>). 

2xy=1 2xy=1

20. 

x= y 3 x= y 3

[21](<chapter-3>). 

y= x 3 y= x 3

22. 

y= 1− x 2 y= 1− x 2

[23](<chapter-3>). 

x=± 1−y x=± 1−y

24. 

y=± 1−x y=± 1−x

[25](<chapter-3>). 

y 2 = x 2 y 2 = x 2

26. 

y 3 = x 2 y 3 = x 2

For the following exercises, evaluate  f(−3),f(2),f(−a),−f(a),f(a+h). f(−3),f(2),f(−a),−f(a),f(a+h).

[27](<chapter-3>). 

f(x)=2x−5 f(x)=2x−5

28. 

f(x)=−5 x 2 +2x−1 f(x)=−5 x 2 +2x−1

[29](<chapter-3>). 

f(x)= 2−x +5 f(x)= 2−x +5

30. 

f(x)= 6x−1 5x+2 f(x)= 6x−1 5x+2

[31](<chapter-3>). 

f(x)=| x−1 |−| x+1 | f(x)=| x−1 |−| x+1 |

32. 

Given the function  g(x)=5− x 2 , g(x)=5− x 2 , evaluate  g(x+h)−g(x) h ,h≠0. g(x+h)−g(x) h ,h≠0.

[33](<chapter-3>). 

Given the function  g(x)= x 2 +2x, g(x)= x 2 +2x, evaluate  g(x)−g(a) x−a ,x≠a. g(x)−g(a) x−a ,x≠a.

34. 

Given the function  k(t)=2t−1:k(t)=2t−1:

  1. ⓐ Evaluate  k(2).k(2).
  2. ⓑ Solve  k(t)=7.k(t)=7.

[35](<chapter-3>). 

Given the function  f(x)=8−3x:f(x)=8−3x:

  1. ⓐ Evaluate  f(−2).f(−2).
  2. ⓑ Solve  f(x)=−1.f(x)=−1.

36. 

Given the function  p(c)= c 2 +c:p(c)= c 2 +c:

  1. ⓐ Evaluate  p(−3).p(−3).
  2. ⓑ Solve  p(c)=2.p(c)=2.

[37](<chapter-3>). 

Given the function  f(x)= x 2 −3x:f(x)= x 2 −3x:

  1. ⓐ Evaluate  f(5).f(5).
  2. ⓑ Solve  f(x)=4.f(x)=4.

38. 

Given the function  f(x)= x+2 :f(x)= x+2 :

  1. ⓐ Evaluate  f(7).f(7).
  2. ⓑ Solve  f(x)=4.f(x)=4.

[39](<chapter-3>). 

Consider the relationship  3r+2t=18.3r+2t=18.

  1. ⓐ Write the relationship as a function  r=f(t).r=f(t).
  2. ⓑ Evaluate  f(−3).f(−3).
  3. ⓒ Solve  f(t)=2.f(t)=2.

#### Graphical

For the following exercises, use the vertical line test to determine which graphs show relations that are functions.

40. 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6781260faf7a30fb97885c78a6d89f2985e58683)

[41](<chapter-3>). 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/275859f0956de595bed771e92df88bea4c606b6b)

42. 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/82d59c5c8e2cab9daf8b642c99f404ec3b68ec71)

[43](<chapter-3>). 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7e1e6695671dbdc5fdd13c6292df24659589de16)

44. 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/98682761d2cbc9c6a985c751cbec64a4f5ab6c72)

[45](<chapter-3>). 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e6d4e2487b3a8bea4ef7c12a2ecedbb3590522e6)

46. 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1ed5faebd5a2e010f9836f0b2debae812db23e34)

[47](<chapter-3>). 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/10bb91beb1211c90e1bfedf2abf871eed03682cf)

48. 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1e69db2c5183e7fa038e98cdaff06d94e7ab8e9a)

[49](<chapter-3>). 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3b795553d53f8855d50133833041aaa331eafbf2)

50. 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/dc5da344f0ea697b03aac749c09870cd43188389)

[51](<chapter-3>). 

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3018e80f50d8a98a54a77c8195e5ff0909fdfb3a)

52. 

Given the following graph, 

  1. ⓐ Evaluate  f(−1).f(−1).
  2. ⓑ Solve for  f(x)=3.f(x)=3.

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/116b224fc1b138b738b6ecb2b70503da0e7e4322)

[53](<chapter-3>). 

Given the following graph, 

  1. ⓐ Evaluate  f(0).f(0).
  2. ⓑ Solve for  f(x)=−3.f(x)=−3.

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/bbc5a866536987db4f4ef132d5a9284cfd76e4c9)

54. 

Given the following graph, 

  1. ⓐ Evaluate  f(4).f(4).
  2. ⓑ Solve for  f(x)=1.f(x)=1.

![Graph of relation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5d9b7941d3d9d63959ab95203d4af06211ff29bd)

For the following exercises, determine if the given graph is a one-to-one function.

[55](<chapter-3>). 

![Graph of a circle.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a74a851feb8611af613a729b86ee2f3389b592b9)

56. 

![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f1fbb030419e6af9f50748c3ec28f07f1bb1cd0c)

[57](<chapter-3>). 

![Graph of a rotated cubic function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f017c2a1bd77d38af4391ee96bc1bff0ec60d281)

58. 

![Graph of half of 1/x.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/610cf6440ecd136fddcdd60c1fdceaba01cca50f)

[59](<chapter-3>). 

![Graph of a one-to-one function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d9acf4b98e8b11fc0e3e7d3e8d6e765bbdc89dbf)

#### Numeric

For the following exercises, determine whether the relation represents a function.

60. 

{ ( −1,−1 ),( −2,−2 ),( −3,−3 ) } { ( −1,−1 ),( −2,−2 ),( −3,−3 ) }

[61](<chapter-3>). 

{ ( 3,4 ),( 4,5 ),( 5,6 ) } { ( 3,4 ),( 4,5 ),( 5,6 ) }

62. 

{ (2,5),(7,11),(15,8),(7,9) } { (2,5),(7,11),(15,8),(7,9) }

For the following exercises, determine if the relation represented in table form represents  yy as a function of  x.x.

[63](<chapter-3>). 

** x x ** | 5 | 10 | 15  
---|---|---|---  
** y y ** | 3 | 8 | 14  
  
64. 

** x x ** | 5 | 10 | 15  
---|---|---|---  
** y y ** | 3 | 8 | 8  
  
[65](<chapter-3>). 

** x x ** | 5 | 10 | 10  
---|---|---|---  
** y y ** | 3 | 8 | 14  
  
For the following exercises, use the function  ff represented in the table below.

xx | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9  
---|---|---|---|---|---|---|---|---|---|---  
f(x)f(x) | 74 | 28 | 1 | 53 | 56 | 3 | 36 | 45 | 14 | 47  
  
Table  14

66. 

Evaluate  f(3).f(3).

[67](<chapter-3>). 

Solve  f(x)=1.f(x)=1.

For the following exercises, evaluate the function  ff at the values  f( −2 ),f(−1),f(0),f(1), f( −2 ),f(−1),f(0),f(1), and  f(2).f(2).

68. 

f( x )=4−2x f( x )=4−2x

[69](<chapter-3>). 

f( x )=8−3x f( x )=8−3x

70. 

f( x )=8 x 2 −7x+3 f( x )=8 x 2 −7x+3

[71](<chapter-3>). 

f( x )=3+ x+3 f( x )=3+ x+3

72. 

f(x)= x−2 x+3 f(x)= x−2 x+3

[73](<chapter-3>). 

f( x )= 3 x f( x )= 3 x

For the following exercises, evaluate the expressions, given functions  f,g, f,g, and  h:h:

f(x)=3x−2 f(x)=3x−2   
g(x)=5− x 2 g(x)=5− x 2   
h(x)=−2 x 2 +3x−1 h(x)=−2 x 2 +3x−1

74. 

3f( 1 )−4g( −2 ) 3f( 1 )−4g( −2 )

[75](<chapter-3>). 

f( 7 3 )−h( −2 ) f( 7 3 )−h( −2 )

#### Technology

For the following exercises, graph  y= x 2 y= x 2 on the given domain. Determine the corresponding range. Show each graph.

76. 

[−0.1,0.1] [−0.1,0.1]

[77](<chapter-3>). 

[−10,10] [−10,10]

78. 

[−100,100] [−100,100]

For the following exercises, graph  y= x 3 y= x 3 on the given domain. Determine the corresponding range. Show each graph.

[79](<chapter-3>). 

[−0.1,0.1] [−0.1,0.1]

80. 

[−10,10] [−10,10]

[81](<chapter-3>). 

[−100,100] [−100,100]

For the following exercises, graph  y= x y= x on the given domain. Determine the corresponding range. Show each graph.

82. 

[0,0.01] [0,0.01]

[83](<chapter-3>). 

[0,100] [0,100]

84. 

[0,10,000] [0,10,000]

For the following exercises, graph  y= x 3 y= x 3 on the given domain. Determine the corresponding range. Show each graph.

[85](<chapter-3>). 

[−0.001,0.001] [−0.001,0.001]

86. 

[−1000,1000] [−1000,1000]

[87](<chapter-3>). 

[−1,000,000,1,000,000] [−1,000,000,1,000,000]

####  Real-World Applications

88. 

The amount of garbage,  G,G, produced by a city with population  pp is given by  G=f( p ).G=f( p ). G G is measured in tons per week, and  pp is measured in thousands of people.

  1. ⓐ The town of Tola has a population of 40,000 and produces 13 tons of garbage each week. Express this information in terms of the function  f.f.
  2. ⓑ Explain the meaning of the statement  f( 5 )=2.f( 5 )=2.

[89](<chapter-3>). 

The number of cubic yards of dirt,  D,D, needed to cover a garden with area  aa square feet is given by  D=g( a ).D=g( a ).

  1. ⓐ A garden with area 5000 ft2 requires 50 yd3 of dirt. Express this information in terms of the function  g.g.
  2. ⓑ Explain the meaning of the statement  g( 100 )=1.g( 100 )=1.

90. 

Let  f( t )f( t ) be the number of ducks in a lake  tt years after 1990. Explain the meaning of each statement:

  1. ⓐ f( 5 )=30 f( 5 )=30
  2. ⓑ f( 10 )=40 f( 10 )=40

[91](<chapter-3>). 

Let  h( t )h( t ) be the height above ground, in feet, of a rocket  tt seconds after launching. Explain the meaning of each statement:

  1. ⓐ h( 1 )=200 h( 1 )=200
  2. ⓑ h( 2 )=350 h( 2 )=350

92. 

Show that the function  f( x )=3 ( x−5 ) 2 +7f( x )=3 ( x−5 ) 2 +7 is _underline notend underline_ one-to-one.

### Footnotes

  * 1<http://www.baseball-almanac.com/legendary/lisn100.shtml>. Accessed 3/24/2014.
  * 2<http://www.kgbanswers.com/how-long-is-a-dogs-memory-span/4221590>. Accessed 3/24/2014.

