# 3.2 Domain and Range

> Source: College Algebra. OpenStax / Rice University.
> Official URL: https://openstax.org/books/college-algebra/pages/3-2-domain-and-range
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.2 Domain and Range

### Learning Objectives

In this section, you will:

  * Find the domain of a function defined by an equation.
  * Graph piecewise-defined functions.

If you’re in the mood for a scary movie, you may want to check out one of the five most popular horror movies of all time— _I am Legend_ , _Hannibal_ , _The Ring_ , _The Grudge_ , and _The Conjuring_. [Figure 1](<3-2-domain-and-range#Figure_01_02_001>) shows the amount, in dollars, each of those movies grossed when they were released as well as the ticket sales for horror movies in general by year. Notice that we can use the data to create a function of the amount each movie earned or the total ticket sales for all horror movies by year. In creating various functions using the data, we can identify different independent and dependent variables, and we can analyze the data and the functions to determine the domain and range. In this section, we will investigate methods for determining the domain and range of functions such as these.

![Two graphs where the first graph is of the Top-Five Grossing Horror Movies for years 2000-2003 and Market Share of Horror Movies by Year](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0f690c4ddb2e130ab9e66aa11bcfe33bcd9bd7f8) Figure  1 Based on data compiled by [www.the-numbers.com](<https://www.the-numbers.com>).[3](<3-2-domain-and-range#fs-id1165137758551>)

### Finding the Domain of a Function Defined by an Equation

In [Functions and Function Notation](<3-1-functions-and-function-notation>), we were introduced to the concepts of domain and range. In this section, we will practice determining domains and ranges for specific functions. Keep in mind that, in determining domains and ranges, we need to consider what is physically possible or meaningful in real-world examples, such as tickets sales and year in the horror movie example above. We also need to consider what is mathematically permitted. For example, we cannot include any input value that leads us to take an even root of a negative number if the domain and range consist of real numbers. Or in a function expressed as a formula, we cannot include any input value in the domain that would lead us to divide by 0.

We can visualize the domain as a “holding area” that contains “raw materials” for a “function machine” and the range as another “holding area” for the machine’s products. See [Figure 2](<3-2-domain-and-range#Figure_01_02_002>).

![Diagram of how a function relates two relations.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/07c120060187fc6ff9d4b472180df78db7cd2034) Figure  2

We can write the domain and range in interval notation, which uses values within brackets to describe a set of numbers. In interval notation, we use a square bracket [ when the set includes the endpoint and a parenthesis ( to indicate that the endpoint is either not included or the interval is unbounded. For example, if a person has $100 to spend, he or she would need to express the interval that is more than 0 and less than or equal to 100 and write  ( 0,100 ]. ( 0,100 ]. We will discuss interval notation in greater detail later.

Let’s turn our attention to finding the domain of a function whose equation is provided. Oftentimes, finding the domain of such functions involves remembering three different forms. First, if the function has no denominator or an odd root, consider whether the domain could be all real numbers. Second, if there is a denominator in the function’s equation, exclude values in the domain that force the denominator to be zero. Third, if there is an even root, consider excluding values that would make the radicand negative.

Before we begin, let us review the conventions of interval notation:

  * The smallest number from the interval is written first.
  * The largest number in the interval is written second, following a comma.
  * Parentheses, ( or ), are used to signify that an endpoint value is not included, called exclusive.
  * Brackets, [ or ], are used to indicate that an endpoint value is included, called inclusive.

See [Figure 3](<3-2-domain-and-range#Figure_01_02_029>) for a summary of interval notation.

![Summary of interval notation.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b8e583b5d39ad28fd3c67fc29332cc49b19c1cd7) Figure  3

###  Example  1

#### Finding the Domain of a Function as a Set of Ordered Pairs 

Find the domain of the following function:  { ( 2,10 ),( 3,10 ),( 4,20 ),( 5,30 ),( 6,40 ) } { ( 2,10 ),( 3,10 ),( 4,20 ),( 5,30 ),( 6,40 ) } .

####  Solution

First identify the input values. The input value is the first coordinate in an ordered pair. There are no restrictions, as the ordered pairs are simply listed. The domain is the set of the first coordinates of the ordered pairs.

{2,3,4,5,6} {2,3,4,5,6}

###  Try It  #1

Find the domain of the function:

{ (−5,4),(0,0),(5,−4),(10,−8),(15,−12) } { (−5,4),(0,0),(5,−4),(10,−8),(15,−12) }

###  How To

**Given a function written in equation form, find the domain.**

  1. Identify the input values.
  2. Identify any restrictions on the input and exclude those values from the domain.
  3. Write the domain in interval form, if possible.

###  Example  2

#### Finding the Domain of a Function

Find the domain of the function  f(x)= x 2 −1. f(x)= x 2 −1.

####  Solution

The input value, shown by the variable  x x in the equation, is squared and then the result is lowered by one. Any real number may be squared and then be lowered by one, so there are no restrictions on the domain of this function. The domain is the set of real numbers.

In interval form, the domain of  f f is  ( −∞,∞ ). ( −∞,∞ ).

###  Try It  #2

Find the domain of the function:  f(x)=5−x+ x 3 . f(x)=5−x+ x 3 .

###  How To

**Given a function written in an equation form that includes a fraction, find the domain.**

  1. Identify the input values.
  2. Identify any restrictions on the input. If there is a denominator in the function’s formula, set the denominator equal to zero and solve for  x x . If the function’s formula contains an even root, set the radicand greater than or equal to 0, and then solve.
  3. Write the domain in interval form, making sure to exclude any restricted values from the domain.

###  Example  3

#### Finding the Domain of a Function Involving a Denominator 

Find the domain of the function  f(x)= x+1 2−x . f(x)= x+1 2−x .

####  Solution

When there is a denominator, we want to include only values of the input that do not force the denominator to be zero. So, we will set the denominator equal to 0 and solve for  x. x.

2−x = 0 −x = −2 x = 2 2−x = 0 −x = −2 x = 2

Now, we will exclude 2 from the domain. The answers are all real numbers where  x<2 x<2 or  x>2 x>2 as shown in [Figure 4](<3-2-domain-and-range#Image_01_02_028>). We can use a symbol known as the union,  ∪, ∪, to combine the two sets. In interval notation, we write the solution:  ( −∞,2 )∪( 2,∞ ). ( −∞,2 )∪( 2,∞ ).

![Line graph of x=!2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f5b60423d3e7587eb268720f0b2b70524a8b80ed) Figure  4

###  Try It  #3

Find the domain of the function:  f(x)= 1+4x 2x−1 . f(x)= 1+4x 2x−1 .

###  How To

**Given a function written in equation form including an even root, find the domain.**

  1. Identify the input values.
  2. Since there is an even root, exclude any real numbers that result in a negative number in the radicand. Set the radicand greater than or equal to zero and solve for  x. x.
  3. The solution(s) are the domain of the function. If possible, write the answer in interval form.

###  Example  4

#### Finding the Domain of a Function with an Even Root

Find the domain of the function  f(x)= 7−x . f(x)= 7−x .

####  Solution

When there is an even root in the formula, we exclude any real numbers that result in a negative number in the radicand.

Set the radicand greater than or equal to zero and solve for  x. x.

7−x ≥ 0 −x ≥ −7 x ≤ 7 7−x ≥ 0 −x ≥ −7 x ≤ 7

Now, we will exclude any number greater than 7 from the domain. The answers are all real numbers less than or equal to  7, 7, or  (−∞,7]. (−∞,7].

###  Try It  #4

Find the domain of the function  f(x)= 5+2x . f(x)= 5+2x .

###  Q&A

**Can there be functions in which the domain and range do not intersect at all?**

_Yes. For example, the function f(x)=− 1 x f(x)=− 1 x has the set of all positive real numbers as its domain but the set of all negative real numbers as its range. As a more extreme example, a function’s inputs and outputs can be completely different categories (for example, names of weekdays as inputs and numbers as outputs, as on an attendance chart), in such cases the domain and range have no elements in common._

### Using Notations to Specify Domain and Range

In the previous examples, we used inequalities and lists to describe the domain of functions. We can also use inequalities, or other statements that might define sets of values or data, to describe the behavior of the variable in set-builder notation. For example,  { x|10≤x<30 } { x|10≤x<30 } describes the behavior of  x x in set-builder notation. The braces  {} {} are read as “the set of,” and the vertical bar | is read as “such that,” so we would read  { x|10≤x<30 } { x|10≤x<30 } as “the set of _x_ -values such that 10 is less than or equal to  x, x, and  x x is less than 30.”

[Figure 5](<3-2-domain-and-range#Figure_01_02_003>) compares inequality notation, set-builder notation, and interval notation.

![Summary of notations for inequalities, set-builder, and intervals.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2f9ce8337265b855f9562148a7983e0244e78701) Figure  5

To combine two intervals using inequality notation or set-builder notation, we use the word “or.” As we saw in earlier examples, we use the union symbol,  ∪, ∪, to combine two unconnected intervals. For example, the union of the sets  {2,3,5} {2,3,5} and  {4,6} {4,6} is the set  {2,3,4,5,6}. {2,3,4,5,6}. It is the set of all elements that belong to one _or_ the other (or both) of the original two sets. For sets with a finite number of elements like these, the elements do not have to be listed in ascending order of numerical value. If the original two sets have some elements in common, those elements should be listed only once in the union set. For sets of real numbers on intervals, another example of a union is

{ x| | x |≥3 }=( −∞,−3 ]∪[ 3,∞ ) { x| | x |≥3 }=( −∞,−3 ]∪[ 3,∞ )

###  Set-Builder Notation and Interval Notation

**Set-builder notation** is a method of specifying a set of elements that satisfy a certain condition. It takes the form  {x|statement about x} {x|statement about x} which is read as, “the set of all  x x such that the statement about  x x is true.” For example,

{ x|4<x≤12 } { x|4<x≤12 }

**Interval notation** is a way of describing sets that include all real numbers between a lower limit that may or may not be included and an upper limit that may or may not be included. The endpoint values are listed between brackets or parentheses. A square bracket indicates inclusion in the set, and a parenthesis indicates exclusion from the set. For example,

( 4,12 ] ( 4,12 ]

###  How To

**Given a line graph, describe the set of values using interval notation.**

  1. Identify the intervals to be included in the set by determining where the heavy line overlays the real line.
  2. At the left end of each interval, use [ with each end value to be included in the set (solid dot) or ( for each excluded end value (open dot).
  3. At the right end of each interval, use ] with each end value to be included in the set (filled dot) or ) for each excluded end value (open dot).
  4. Use the union symbol  ∪ ∪ to combine all intervals into one set.

###  Example  5

#### Describing Sets on the Real-Number Line

Describe the intervals of values shown in [Figure 6](<3-2-domain-and-range#Figure_01_02_004>) using inequality notation, set-builder notation, and interval notation.

![Line graph of 1<=x<=3 and 5<x.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8e665894cdaf2f2521c3b596e93adddf67c9f1e8) Figure  6

####  Solution

To describe the values,  x, x, included in the intervals shown, we would say, “  x x is a real number greater than or equal to 1 and less than or equal to 3, or a real number greater than 5.”

**Inequality** |  1≤x≤3orx>5 1≤x≤3orx>5  
---|---  
**Set-builder notation** |  { x|1≤x≤3orx>5 } { x|1≤x≤3orx>5 }  
**Interval notation** |  [1,3]∪(5,∞) [1,3]∪(5,∞)  
  
Remember that, when writing or reading interval notation, using a square bracket means the boundary is included in the set. Using a parenthesis means the boundary is not included in the set.

###  Try It  #5

Given [Figure 7](<3-2-domain-and-range#Figure_01_02_005>), specify the graphed set in

  1. ⓐ words
  2. ⓑ set-builder notation
  3. ⓒ interval notation

![Line graph of -2<=x, -1<=x<3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e0cf9fe0cff1fc5741034256591845e97e1b4c1d) Figure  7

### Finding Domain and Range from Graphs

Another way to identify the domain and range of functions is by using graphs. Because the domain refers to the set of possible input values, the domain of a graph consists of all the input values shown on the _x_ -axis. The range is the set of possible output values, which are shown on the _y_ -axis. Keep in mind that if the graph continues beyond the portion of the graph we can see, the domain and range may be greater than the visible values. See [Figure 8](<3-2-domain-and-range#Figure_01_02_006>).

![Graph of a polynomial that shows the x-axis is the domain and the y-axis is the range](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/bdb9fbd4223a2df372b6a7d891f400067bdb8de7) Figure  8

We can observe that the graph extends horizontally from  −5 −5 to the right without bound, so the domain is  [ −5,∞ ). [ −5,∞ ). The vertical extent of the graph is all range values  5 5 and below, so the range is  ( −∞,5 ]. ( −∞,5 ]. Note that the domain and range are always written from smaller to larger values, or from left to right for domain, and from the bottom of the graph to the top of the graph for range.

###  Example  6

#### Finding Domain and Range from a Graph

Find the domain and range of the function  f f whose graph is shown in [Figure 9](<3-2-domain-and-range#Figure_01_02_007>).

![Graph of a function from \(-3, 1\].](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7803fe13db98ea4e962981ef2bb50708d8b0d762) Figure  9

####  Solution

We can observe that the horizontal extent of the graph is –3 to 1, so the domain of  f f is  ( −3,1 ]. ( −3,1 ].

The vertical extent of the graph is 0 to –4, so the range is  [ −4 , 0 ). [ −4 , 0 ). See [Figure 10](<3-2-domain-and-range#Figure_01_02_008>).

![Graph of the previous function shows the domain and range.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9934175b9729c4ead45f1689b08e52d33200f492) Figure  10

###  Example  7

#### Finding Domain and Range from a Graph of Oil Production

Find the domain and range of the function  f f whose graph is shown in [Figure 11](<3-2-domain-and-range#Figure_01_02_009>).

![Graph of the Alaska Crude Oil Production where the y-axis is thousand barrels per day and the -axis is the years.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e30b590b2926e838e31fab2e295a12080827f0ca) Figure  11 (credit: modification of work by the U.S. Energy Information Administration)[4](<3-2-domain-and-range#fs-id1165135445728>)

####  Solution

The input quantity along the horizontal axis is “years,” which we represent with the variable  t t for time. The output quantity is “thousands of barrels of oil per day,” which we represent with the variable  b b for barrels. The graph may continue to the left and right beyond what is viewed, but based on the portion of the graph that is visible, we can determine the domain as  1973≤t≤2008 1973≤t≤2008 and the range as approximately  180≤b≤2010. 180≤b≤2010.

In interval notation, the domain is [1973, 2008], and the range is about [180, 2010]. For the domain and the range, we approximate the smallest and largest values since they do not fall exactly on the grid lines.

###  Try It  #6

Given [Figure 12](<3-2-domain-and-range#Figure_01_02_010>), identify the domain and range using interval notation.

![Graph of World Population Increase where the y-axis represents millions of people and the x-axis represents the year.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/53a18bfc04cd4aba9c6df434d9ed678492043b53) Figure  12

###  Q&A

**Can a function’s domain and range be the same?**

_Yes. For example, the domain and range of the cube root function are both the set of all real numbers._

### Finding Domains and Ranges of the Toolkit Functions

We will now return to our set of toolkit functions to determine the domain and range of each.

![Constant function f\(x\)=c.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e84a00551478d9f6c8f611bcb89b1f6c565a17aa) Figure  13 For the constant function f(x)=c, f(x)=c, the domain consists of all real numbers; there are no restrictions on the input. The only output value is the constant  c, c, so the range is the set  {c} {c} that contains this single element. In interval notation, this is written as  [c,c], [c,c], the interval that both begins and ends with  c. c.

![Identity function f\(x\)=x.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f365c13c7b39c67b9668755535b08ac6a4e35637) Figure  14 For the **identity function** f(x)=x, f(x)=x, there is no restriction on  x. x. Both the domain and range are the set of all real numbers.

![Absolute function f\(x\)=|x|.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/28a980658666cc60b2240f8287465930c8bf8210) Figure  15 For the absolute value function f(x)=| x |, f(x)=| x |, there is no restriction on  x. x. However, because absolute value is defined as a distance from 0, the output can only be greater than or equal to 0.

![Quadratic function f\(x\)=x^2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/57f2bfac714174892978257a61023c7506ccf77b) Figure  16 For the **quadratic function** f(x)= x 2 , f(x)= x 2 , the domain is all real numbers since the horizontal extent of the graph is the whole real number line. Because the graph does not include any negative values for the range, the range is only nonnegative real numbers.

![Cubic function f\(x\)-x^3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5223849c166f5673b504bc8022a8c298d8b52bb3) Figure  17 For the **cubic function** f(x)= x 3 , f(x)= x 3 , the domain is all real numbers because the horizontal extent of the graph is the whole real number line. The same applies to the vertical extent of the graph, so the domain and range include all real numbers.

![Reciprocal function f\(x\)=1/x.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/abd1de07575f7ad202a88b3439f2421ad3e1e94c) Figure  18 For the **reciprocal function** f(x)= 1 x , f(x)= 1 x , we cannot divide by 0, so we must exclude 0 from the domain. Further, 1 divided by any value can never be 0, so the range also will not include 0. In set-builder notation, we could also write  {x|x≠0}, {x|x≠0}, the set of all real numbers that are not zero.

![Reciprocal squared function f\(x\)=1/x^2](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/57dfe13a27eb0ccae6aef8afebbaf9a5401b33c8) Figure  19 For the **reciprocal squared function** f(x)= 1 x 2 , f(x)= 1 x 2 , we cannot divide by  0, 0, so we must exclude  0 0 from the domain. There is also no  x x that can give an output of 0, so 0 is excluded from the range as well. Note that the output of this function is always positive due to the square in the denominator, so the range includes only positive numbers.

![Square root function f\(x\)=sqrt\(x\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fd8d9bad05b8286975797f0a09438565f2733be0) Figure  20 For the **square root function** f(x)= x , f(x)= x , we cannot take the square root of a negative real number, so the domain must be 0 or greater. The range also excludes negative numbers because the square root of a positive number  x x is defined to be positive, even though the square of the negative number  − x − x also gives us  x. x.

![Cube root function f\(x\)=x^\(1/3\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/683a8f85f0434754e13c2a9de902fb60b27a073e) Figure  21 For the **cube root function** f(x)= x 3 , f(x)= x 3 , the domain and range include all real numbers. Note that there is no problem taking a cube root, or any odd-integer root, of a negative number, and the resulting output is negative (it is an odd function).

###  How To

**Given the formula for a function, determine the domain and range.**

  1. Exclude from the domain any input values that result in division by zero.
  2. Exclude from the domain any input values that have nonreal (or undefined) number outputs.
  3. Use the valid input values to determine the range of the output values.
  4. Look at the function graph and table values to confirm the actual function behavior.

###  Example  8

#### Finding the Domain and Range Using Toolkit Functions

Find the domain and range of  f(x)=2 x 3 −x. f(x)=2 x 3 −x.

####  Solution

There are no restrictions on the domain, as any real number may be cubed and then subtracted from the result.

The domain is  ( −∞,∞ ) ( −∞,∞ ) and the range is also  ( −∞,∞ ). ( −∞,∞ ).

###  Example  9

#### Finding the Domain and Range 

Find the domain and range of  f(x)= 2 x+1 . f(x)= 2 x+1 .

####  Solution

We cannot evaluate the function at  −1 −1 because division by zero is undefined. The domain is  ( −∞,−1 )∪( −1,∞ ). ( −∞,−1 )∪( −1,∞ ). Because the function is never zero, we exclude 0 from the range. The range is  ( −∞,0 )∪( 0,∞ ). ( −∞,0 )∪( 0,∞ ).

###  Example  10

#### Finding the Domain and Range 

Find the domain and range of  f(x)=2 x+4 . f(x)=2 x+4 .

####  Solution

We cannot take the square root of a negative number, so the value inside the radical must be nonnegative.

x+4≥0when x≥−4 x+4≥0when x≥−4

The domain of  f( x ) f( x ) is  [−4,∞). [−4,∞).

We then find the range. We know that  f( −4 )=0, f( −4 )=0, and the function value increases as  x x increases without any upper limit. We conclude that the range of  f f is  [ 0, ∞ ) . [ 0, ∞ ) .

#### Analysis 

[Figure 22](<3-2-domain-and-range#Figure_01_02_020>) represents the function  f. f.

![Graph of a square root function at \(-4, 0\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/58f4b1f2a4e2858b3fcb8c17233da5fe805f9377) Figure  22

###  Try It  #7

Find the domain and range of  f( x )=− 2−x . f( x )=− 2−x .

### Graphing Piecewise-Defined Functions

Sometimes, we come across a function that requires more than one formula in order to obtain the given output. For example, in the toolkit functions, we introduced the absolute value function  f(x)=| x |. f(x)=| x |. With a domain of all real numbers and a range of values greater than or equal to 0, absolute value can be defined as the magnitude, or modulus, of a real number value regardless of sign. It is the distance from 0 on the number line. All of these definitions require the output to be greater than or equal to 0.

If we input 0, or a positive value, the output is the same as the input.

f(x)=xifx≥0 f(x)=xifx≥0

If we input a negative value, the output is the opposite of the input.

f(x)=−xifx<0 f(x)=−xifx<0

Because this requires two different processes or pieces, the absolute value function is an example of a piecewise function. A piecewise function is a function in which more than one formula is used to define the output over different pieces of the domain.

We use piecewise functions to describe situations in which a rule or relationship changes as the input value crosses certain “boundaries.” For example, we often encounter situations in business for which the cost per piece of a certain item is discounted once the number ordered exceeds a certain value. Tax brackets are another real-world example of piecewise functions. For example, consider a simple tax system in which incomes up to $10,000 are taxed at 10%, and any additional income is taxed at 20%. The tax on a total income  S S would be  0.1S 0.1S if  S≤$10,000 S≤$10,000 and  $1000+0.2(S−$10,000) $1000+0.2(S−$10,000) if  S>$10,000. S>$10,000.

###  Piecewise Function

A **piecewise function** is a function in which more than one formula is used to define the output. Each formula has its own domain, and the domain of the function is the union of all these smaller domains. We notate this idea like this:

f(x)={ formula 1 if xis in domain 1 formula 2 if xis in domain 2 formula 3 if xis in domain 3 f(x)={ formula 1 if xis in domain 1 formula 2 if xis in domain 2 formula 3 if xis in domain 3

In piecewise notation, the absolute value function is

| x |={ x if x≥0 −x if x<0 | x |={ x if x≥0 −x if x<0

###  How To

**Given a piecewise function, write the formula and identify the domain for each interval.**

  1. Identify the intervals for which different rules apply.
  2. Determine formulas that describe how to calculate an output from an input in each interval.
  3. Use braces and if-statements to write the function.

###  Example  11

#### Writing a Piecewise Function

A museum charges $5 per person for a guided tour with a group of 1 to 9 people or a fixed $50 fee for a group of 10 or more people. Write a function relating the number of people,  n, n, to the cost,  C. C.

####  Solution

Two different formulas will be needed. For _n_ -values under 10,  C=5n. C=5n. For values of  n n that are 10 or greater,  C=50. C=50.

C(n)={ 5n if 0<n<10 50 if n≥10 C(n)={ 5n if 0<n<10 50 if n≥10

#### Analysis 

The function is represented in [Figure 23](<3-2-domain-and-range#Figure_01_02_021>). The graph is a diagonal line from  n=0 n=0 to  n=10 n=10 and a constant after that. In this example, the two formulas agree at the meeting point where  n=10, n=10, but not all piecewise functions have this property.

![Graph of C\(n\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ddd5650076d9fc0801b73b14769d868d34a4b148) Figure  23

###  Example  12

#### Working with a Piecewise Function

A cell phone company uses the function below to determine the cost,  C, C, in dollars for  g g gigabytes of data transfer.

C(g)={ 25 if 0<g<2 25+10(g−2) if g≥2 C(g)={ 25 if 0<g<2 25+10(g−2) if g≥2

Find the cost of using 1.5 gigabytes of data and the cost of using 4 gigabytes of data.

####  Solution

To find the cost of using 1.5 gigabytes of data,  C(1.5), C(1.5), we first look to see which part of the domain our input falls in. Because 1.5 is less than 2, we use the first formula.

C(1.5)=$25 C(1.5)=$25

To find the cost of using 4 gigabytes of data,  C(4), C(4), we see that our input of 4 is greater than 2, so we use the second formula.

C(4)=25+10(4−2)=$45 C(4)=25+10(4−2)=$45

#### Analysis 

The function is represented in [Figure 24](<3-2-domain-and-range#Figure_01_02_022>). We can see where the function changes from a constant to a shifted and stretched identity at  g=2. g=2. We plot the graphs for the different formulas on a common set of axes, making sure each formula is applied on its proper domain. 

![Graph of C\(g\)](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/adb67af5bca8ca1f3fe864ce246312ee5faba681) Figure  24

###  How To

**Given a piecewise function, sketch a graph.**

  1. Indicate on the _x_ -axis the boundaries defined by the intervals on each piece of the domain.
  2. For each piece of the domain, graph on that interval using the corresponding equation pertaining to that piece. Do not graph two functions over one interval because it would violate the criteria of a function.

###  Example  13

#### Graphing a Piecewise Function

Sketch a graph of the function.

f(x)={ x 2 if x≤1 3 if 1<x≤2 x if x>2 f(x)={ x 2 if x≤1 3 if 1<x≤2 x if x>2

####  Solution

Each of the component functions is from our library of toolkit functions, so we know their shapes. We can imagine graphing each function and then limiting the graph to the indicated domain. At the endpoints of the domain, we draw open circles to indicate where the endpoint is not included because of a less-than or greater-than inequality; we draw a closed circle where the endpoint is included because of a less-than-or-equal-to or greater-than-or-equal-to inequality.

[Figure 25](<3-2-domain-and-range#Figure_01_02_023>) shows the three components of the piecewise function graphed on separate coordinate systems.

![Graph of each part of the piece-wise function f\(x\)](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/49964396b7c1b427031e21b24fede43edef0beec) Figure  25 (a)  f( x )= x 2 if x≤1; f( x )= x 2 if x≤1; (b)  f( x )=3if 1< x≤2; f( x )=3if 1< x≤2; (c)  f( x )=x if x>2 f( x )=x if x>2

Now that we have sketched each piece individually, we combine them in the same coordinate plane. See [Figure 26](<3-2-domain-and-range#Figure_01_02_026>).

![Graph of the entire function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7f92bbb110e55a39f363b83cd6e057a921a124d3) Figure  26

#### Analysis 

Note that the graph does pass the vertical line test even at  x=1 x=1 and  x=2 x=2 because the points (1,3)(1,3) and (2,2 )(2,2 ) are not part of the graph of the function, though (1,1)(1,1) and (2,3)(2,3) are.

###  Try It  #8

Graph the following piecewise function.

f(x)={ x 3 if x<−1 −2 if −1<x<4 x if x>4 f(x)={ x 3 if x<−1 −2 if −1<x<4 x if x>4

###  Q&A

**Can more than one formula from a piecewise function be applied to a value in the domain?**

_No. Each value corresponds to one equation in a piecewise formula._

###  Media

Access these online resources for additional instruction and practice with domain and range.

  * [Domain and Range of Square Root Functions](<http://openstax.org/l/domainsqroot>)
  * [Determining Domain and Range](<http://openstax.org/l/determinedomain>)
  * [Find Domain and Range Given the Graph](<http://openstax.org/l/drgraph>)
  * [Find Domain and Range Given a Table](<http://openstax.org/l/drtable>)
  * [Find Domain and Range Given Points on a Coordinate Plane](<http://openstax.org/l/drcoordinate>)

###  3.2 Section Exercises

#### Verbal

[1](<chapter-3>). 

Why does the domain differ for different functions?

2. 

How do we determine the domain of a function defined by an equation?

[3](<chapter-3>). 

Explain why the domain of  f(x)= x 3 f(x)= x 3 is different from the domain of  f(x)= x . f(x)= x .

4. 

When describing sets of numbers using interval notation, when do you use a parenthesis and when do you use a bracket?

[5](<chapter-3>). 

How do you graph a piecewise function?

#### Algebraic

For the following exercises, find the domain of each function using interval notation.

6. 

f(x)=−2x(x−1)(x−2) f(x)=−2x(x−1)(x−2)

[7](<chapter-3>). 

f(x)=5−2 x 2 f(x)=5−2 x 2

8. 

f( x )=3 x−2 f( x )=3 x−2

[9](<chapter-3>). 

f( x )=3− 6−2x f( x )=3− 6−2x

10. 

f(x)= 4−3x f(x)= 4−3x

[11](<chapter-3>). 

f(x)= x 2 +4 f(x)= x 2 +4

12. 

f(x)= 1−2x 3 f(x)= 1−2x 3

[13](<chapter-3>). 

f(x)= x−1 3 f(x)= x−1 3

14. 

f(x)= 9 x−6 f(x)= 9 x−6

[15](<chapter-3>). 

f( x )= 3x+1 4x+2 f( x )= 3x+1 4x+2

16. 

f( x )= x+4 x−4 f( x )= x+4 x−4

[17](<chapter-3>). 

f(x)= x−3 x 2 +9x−22 f(x)= x−3 x 2 +9x−22

18. 

f(x)= 1 x 2 −x−6 f(x)= 1 x 2 −x−6

[19](<chapter-3>). 

f(x)= 2 x 3 −250 x 2 −2x−15 f(x)= 2 x 3 −250 x 2 −2x−15

20. 

5 x−3 5 x−3

[21](<chapter-3>). 

2x+1 5−x 2x+1 5−x

22. 

f(x)= x−4 x−6 f(x)= x−4 x−6

[23](<chapter-3>). 

f(x)= x−6 x−4 f(x)= x−6 x−4

24. 

f(x)= x x f(x)= x x

[25](<chapter-3>). 

f(x)= x 2 −9x x 2 −81 f(x)= x 2 −9x x 2 −81

26. 

Find the domain of the function  f(x)= 2 x 3 −50x f(x)= 2 x 3 −50x by:

  1. ⓐusing algebra.
  2. ⓑgraphing the function in the radicand and determining intervals on the _x_ -axis for which the radicand is nonnegative.

#### Graphical

For the following exercises, write the domain and range of each function using interval notation.

[27](<chapter-3>). 

![Graph of a function from \(2, 8\].](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3c6b3161446c6c8d301aead942e5d2d175362989)

28. 

![Graph of a function from \[4, 8\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/281e9ca4b0473e406faf77c68f51968a4eb998e2)

[29](<chapter-3>). 

![Graph of a function from \[-4, 4\].](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f441931ef96b126c0a77b4bdaf3116f9c3c2ccea)

30. 

![Graph of a function from \[2, 6\].](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/63a955eab502d4942f525a3e5809f46aa654b385)

[31](<chapter-3>). 

![Graph of a function from \[-5, 3\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/138ef16ebbcbc6df40cf984d03b5ccd815a7198c)

32. 

![Graph of a function from \[-3, 2\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/80aef19537877f14d97db445ff608cc03b456a0b)

[33](<chapter-3>). 

![Graph of a function from \(-infinity, 2\].](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4559b5d01125ba7fe3aa5b4c9019efb69836cb27)

34. 

![Graph of a function from \[-4, infinity\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1f7432cb90701c6de87c975925acafb1ebe19fd3)

[35](<chapter-3>). 

![Graph of a function from \[-6, -1/6\]U\[1/6, 6\]/.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3ca23645907f74e4350656b3dc6326eed2d89ae7)

36. 

![Graph of a function from \(-2.5, infinity\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8e46fd3b563a0411ee3395be05e5f28885b7b46a)

[37](<chapter-3>). 

![Graph of a function from \[-3, infinity\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5daa1977b4c4fcbd7ba4741e6c97b5c49f59dd6c)

For the following exercises, sketch a graph of the piecewise function. Write the domain in interval notation.

38. 

f(x)={ x+1 if x<−2 −2x−3 if x≥−2 f(x)={ x+1 if x<−2 −2x−3 if x≥−2

[39](<chapter-3>). 

f(x)={ 2x−1 if x<1 1+x if x≥1 f(x)={ 2x−1 if x<1 1+x if x≥1

40. 

f(x)={ x+1ifx<0 x−1ifx>0 f(x)={ x+1ifx<0 x−1ifx>0

[41](<chapter-3>). 

f( x )={ 3 if x<0 x if x≥0 f( x )={ 3 if x<0 x if x≥0

42. 

f(x)={ x 2 if x<0 1−x if x>0 f(x)={ x 2 if x<0 1−x if x>0

[43](<chapter-3>). 

f(x)={ x 2 x+2 ifx<0 ifx≥0 f(x)={ x 2 x+2 ifx<0 ifx≥0

44. 

f( x )={ x+1 if x<1 x 3 if x≥1 f( x )={ x+1 if x<1 x 3 if x≥1

[45](<chapter-3>). 

f(x)={ |x| 1 ifx<2 ifx≥2 f(x)={ |x| 1 ifx<2 ifx≥2

#### Numeric

For the following exercises, given each function  f, f, evaluate  f(−3),f(−2),f(−1), f(−3),f(−2),f(−1), and  f(0). f(0).

46. 

f(x)={ x+1 if x<−2 −2x−3 if x≥−2 f(x)={ x+1 if x<−2 −2x−3 if x≥−2

[47](<chapter-3>). 

f(x)={ 1 if x≤−3 0 if x>−3 f(x)={ 1 if x≤−3 0 if x>−3

48. 

f(x)={ −2 x 2 +3 if x≤−1 5x−7 if x>−1 f(x)={ −2 x 2 +3 if x≤−1 5x−7 if x>−1

For the following exercises, given each function  f, f, evaluate  f(−1),f(0),f(2), f(−1),f(0),f(2), and  f(4). f(4).

[49](<chapter-3>). 

f(x)={ 7x+3 if x<0 7x+6 if x≥0 f(x)={ 7x+3 if x<0 7x+6 if x≥0

50. 

f( x )={ x 2 −2 if x<2 4+| x−5 | if x≥2 f( x )={ x 2 −2 if x<2 4+| x−5 | if x≥2

[51](<chapter-3>). 

f( x )={ 5x if x<0 3 if 0≤x≤3 x 2 if x>3 f( x )={ 5x if x<0 3 if 0≤x≤3 x 2 if x>3

For the following exercises, write the domain for the piecewise function in interval notation.

52. 

f(x)={ x+1ifx<−2 −2x−3ifx≥−2 f(x)={ x+1ifx<−2 −2x−3ifx≥−2

[53](<chapter-3>). 

f(x)={ x 2 −2ifx<1 − x 2 +2ifx>1 f(x)={ x 2 −2ifx<1 − x 2 +2ifx>1

54. 

f(x)={ 2x−3 −3 x 2 ifx<0 ifx≥2 f(x)={ 2x−3 −3 x 2 ifx<0 ifx≥2

#### Technology

[55](<chapter-3>). 

Graph  y= 1 x 2 y= 1 x 2 on the viewing window  [−0.5,−0.1] [−0.5,−0.1] and  [0.1,0.5]. [0.1,0.5]. Determine the corresponding range for the viewing window. Show the graphs.

56. 

Graph  y= 1 x y= 1 x on the viewing window  [−0.5,−0.1] [−0.5,−0.1] and  [0.1,0.5]. [0.1,0.5]. Determine the corresponding range for the viewing window. Show the graphs.

####  Extension

[57](<chapter-3>). 

Suppose the range of a function  f f is  [−5,8]. [−5,8]. What is the range of  |f(x)|? |f(x)|?

58. 

Create a function in which the range is all nonnegative real numbers.

[59](<chapter-3>). 

Create a function in which the domain is  x>2. x>2.

####  Real-World Applications

60. 

The height  h h of a projectile is a function of the time  t t it is in the air. The height in feet for  t t seconds is given by the function  h(t)=−16 t 2 +96t. h(t)=−16 t 2 +96t. What is the domain of the function? What does the domain mean in the context of the problem?

[61](<chapter-3>). 

The cost in dollars of making  x x items is given by the function  C(x)=10x+500. C(x)=10x+500.

  1. ⓐThe fixed cost is determined when zero items are produced. Find the fixed cost for this item.
  2. ⓑWhat is the cost of making 25 items?
  3. ⓒSuppose the maximum cost allowed is $1500. What are the domain and range of the cost function,  C(x)? C(x)?

### Footnotes

  * 3The Numbers: Where Data and the Movie Business Meet. “Box Office History for Horror Movies.” <http://www.the-numbers.com/market/genre/Horror>. Accessed 3/24/2014
  * 4[http://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=MCRFPAK2&f=A](<http://www.eia.gov/dnav/pet/hist/LeafHandler.ashx?n=PET&s=MCRFPAK2&f=A>).

