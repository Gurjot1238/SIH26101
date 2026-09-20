# 3.3 Rates of Change and Behavior of Graphs

> Source: Algebra and Trigonometry. OpenStax / Rice University.
> Official URL: https://openstax.org/books/algebra-and-trigonometry/pages/3-3-rates-of-change-and-behavior-of-graphs
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.3 Rates of Change and Behavior of Graphs

### Learning Objectives

In this section, you will:

  * Find the average rate of change of a function.
  * Use a graph to determine where a function is increasing, decreasing, or constant.
  * Use a graph to locate local maxima and local minima.
  * Use a graph to locate the absolute maximum and absolute minimum.

Gasoline costs have experienced some wild fluctuations over the last several decades. [Table 1](<3-3-rates-of-change-and-behavior-of-graphs#Table_01_03_01>)[5](<3-3-rates-of-change-and-behavior-of-graphs#fs-id1165137642606>) lists the average cost, in dollars, of a gallon of gasoline for the years 2005–2012. The cost of gasoline can be considered as a function of year.

** y y ** | 2005 | 2006 | 2007 | 2008 | 2009 | 2010 | 2011 | 2012  
---|---|---|---|---|---|---|---|---  
** C( y ) C( y ) ** | 2.31 | 2.62 | 2.84 | 3.30 | 2.41 | 2.84 | 3.58 | 3.68  
  
Table  1

If we were interested only in how the gasoline prices changed between 2005 and 2012, we could compute that the cost per gallon had increased from $2.31 to $3.68, an increase of $1.37. While this is interesting, it might be more useful to look at how much the price changed _per year_. In this section, we will investigate changes such as these.

### Finding the Average Rate of Change of a Function

The price change per year is a rate of change because it describes how an output quantity changes relative to the change in the input quantity. We can see that the price of gasoline in [Table 1](<3-3-rates-of-change-and-behavior-of-graphs#Table_01_03_01>) did not change by the same amount each year, so the rate of change was not constant. If we use only the beginning and ending data, we would be finding the average rate of change over the specified period of time. To find the average rate of change, we divide the change in the output value by the change in the input value.

Average rate of change = Change in output Change in input = Δy Δx = y 2 − y 1 x 2 − x 1 = f( x 2 )−f( x 1 ) x 2 − x 1 Average rate of change = Change in output Change in input = Δy Δx = y 2 − y 1 x 2 − x 1 = f( x 2 )−f( x 1 ) x 2 − x 1

The Greek letter  Δ Δ (delta) signifies the change in a quantity; we read the ratio as “delta-_y_ over delta-_x_ ” or “the change in  y y divided by the change in  x. x.” Occasionally we write  Δf Δf instead of  Δy, Δy, which still represents the change in the function’s output value resulting from a change to its input value. It does not mean we are changing the function into some other function.

In our example, the gasoline price increased by $1.37 from 2005 to 2012. Over 7 years, the average rate of change was

Δy Δx = $1.37 7 years ≈0.196dollars per year Δy Δx = $1.37 7 years ≈0.196dollars per year

On average, the price of gas increased by about 19.6¢ each year.

Other examples of rates of change include:

  * A population of rats increasing by 40 rats per week
  * A car traveling 68 miles per hour (distance traveled changes by 68 miles each hour as time passes)
  * A car driving 27 miles per gallon (distance traveled changes by 27 miles for each gallon)
  * The current through an electrical circuit increasing by 0.125 amperes for every volt of increased voltage
  * The amount of money in a college account decreasing by $4,000 per quarter

###  Rate of Change

A rate of change describes how an output quantity changes relative to the change in the input quantity. The units on a rate of change are “output units per input units.”

The average rate of change between two input values is the total change of the function values (output values) divided by the change in the input values.

Δy Δx = f( x 2 )−f( x 1 ) x 2 − x 1 Δy Δx = f( x 2 )−f( x 1 ) x 2 − x 1

###  How To

**Given the value of a function at different points, calculate the average rate of change of a function for the interval between two values x 1 x 1 and  x 2 . x 2 . **

  1. Calculate the difference  y 2 − y 1 =Δy. y 2 − y 1 =Δy.
  2. Calculate the difference  x 2 − x 1 =Δx. x 2 − x 1 =Δx.
  3. Find the ratio  Δy Δx . Δy Δx .

###  Example  1

#### Computing an Average Rate of Change

Using the data in [Table 1](<3-3-rates-of-change-and-behavior-of-graphs#Table_01_03_01>), find the average rate of change of the price of gasoline between 2007 and 2009.

####  Solution

In 2007, the price of gasoline was $2.84. In 2009, the cost was $2.41. The average rate of change is

Δy Δx = y 2 − y 1 x 2 − x 1 = $2.41−$2.84 2009−2007 = −$0.43 2years = −$0.22per year Δy Δx = y 2 − y 1 x 2 − x 1 = $2.41−$2.84 2009−2007 = −$0.43 2years = −$0.22per year

#### Analysis 

Note that a decrease is expressed by a negative change or “negative increase.” A rate of change is negative when the output decreases as the input increases or when the output increases as the input decreases.

###  Try It  #1

Using the data in [Table 1](<3-3-rates-of-change-and-behavior-of-graphs#Table_01_03_01>), find the average rate of change between 2005 and 2010.

###  Example  2

#### Computing Average Rate of Change from a Graph

Given the function  g( t ) g( t ) shown in [Figure 1](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_001>), find the average rate of change on the interval  [ −1,2 ]. [ −1,2 ].

![Graph of a parabola.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/81a9b49beb5aea11ba59a55c177d94780ab463bd) Figure  1

####  Solution

At  t=−1, t=−1, [Figure 2](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_002>) shows  g( −1 )=4. g( −1 )=4. At  t=2, t=2, the graph shows  g( 2 )=1. g( 2 )=1.

![Graph of a parabola with a line from points \(-1, 4\) and \(2, 1\) to show the changes for g\(t\) and t.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/887f5c84cd5b446004895f538bc0a8c2b5f2ade6) Figure  2

The horizontal change  Δt=3 Δt=3 is shown by the red arrow, and the vertical change  Δg(t)=−3 Δg(t)=−3 is shown by the turquoise arrow. The average rate of change is shown by the slope of the orange line segment. The output changes by –3 while the input changes by 3, giving an average rate of change of

1−4 2−( −1 ) = −3 3 =−1 1−4 2−( −1 ) = −3 3 =−1

#### Analysis 

Note that the order we choose is very important. If, for example, we use  y 2 − y 1 x 1 − x 2 , y 2 − y 1 x 1 − x 2 , we will not get the correct answer. Decide which point will be 1 and which point will be 2, and keep the coordinates fixed as  ( x 1 , y 1 ) ( x 1 , y 1 ) and  ( x 2 , y 2 ). ( x 2 , y 2 ).

###  Example  3

#### Computing Average Rate of Change from a Table

After picking up a friend who lives 10 miles away and leaving on a trip, Anna records her distance from home over time. The values are shown in [Table 2](<3-3-rates-of-change-and-behavior-of-graphs#Table_01_03_02>). Find her average speed over the first 6 hours.

**_t_ (hours)** | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7  
---|---|---|---|---|---|---|---|---  
**_D_(_t_) (miles)** | 10 | 55 | 90 | 153 | 214 | 240 | 292 | 300  
  
Table  2

####  Solution

Here, the average speed is the average rate of change. She traveled 282 miles in 6 hours.

292−10 6−0 = 282 6 = 47 292−10 6−0 = 282 6 = 47

The average speed is 47 miles per hour.

#### Analysis 

Because the speed is not constant, the average speed depends on the interval chosen. For the interval [2,3], the average speed is 63 miles per hour.

###  Example  4

#### Computing Average Rate of Change for a Function Expressed as a Formula

Compute the average rate of change of  f( x )= x 2 − 1 x f( x )= x 2 − 1 x on the interval  [2,4]. [2,4].

####  Solution

We can start by computing the function values at each endpoint of the interval.

f(2) = 2 2 − 1 2 f(4) = 4 2 − 1 4 = 4− 1 2 = 16− 1 4 = 7 2 = 63 4 f(2) = 2 2 − 1 2 f(4) = 4 2 − 1 4 = 4− 1 2 = 16− 1 4 = 7 2 = 63 4

Now we compute the average rate of change.

Average rate of change = f(4)−f(2) 4−2 = 63 4 − 7 2 4−2 = 49 4 2 = 49 8 Average rate of change = f(4)−f(2) 4−2 = 63 4 − 7 2 4−2 = 49 4 2 = 49 8

###  Try It  #2

Find the average rate of change of  f( x )=x−2 x f( x )=x−2 x on the interval  [1,9]. [1,9].

###  Example  5

#### Finding the Average Rate of Change of a Force

The electrostatic force F, F, measured in newtons, between two charged particles can be related to the distance between the particles  d, d, in centimeters, by the formula  F( d )= 2 d 2 . F( d )= 2 d 2 . Find the average rate of change of force if the distance between the particles is increased from 2 cm to 6 cm.

####  Solution

We are computing the average rate of change of  F( d )= 2 d 2 F( d )= 2 d 2 on the interval  [2,6]. [2,6].

Average rate of change = F(6)−F(2) 6−2 = 2 6 2 − 2 2 2 6−2 Simplify. = 2 36 − 2 4 4 = − 16 36 4 Combine numerator terms. = − 1 9 Simplify Average rate of change = F(6)−F(2) 6−2 = 2 6 2 − 2 2 2 6−2 Simplify. = 2 36 − 2 4 4 = − 16 36 4 Combine numerator terms. = − 1 9 Simplify

The average rate of change is  − 1 9 − 1 9 newton per centimeter.

###  Example  6

#### Finding an Average Rate of Change as an Expression

Find the average rate of change of  g( t )= t 2 +3t+1 g( t )= t 2 +3t+1 on the interval  [0,a]. [0,a]. The answer will be an expression involving  a a in simplest form. 

####  Solution

We use the average rate of change formula.  

Average rate of change = g(a)−g(0) a−0 Evaluate. = ( a 2 +3a+1)−( 0 2 +3(0)+1) a−0 Simplify. = a 2 +3a+1−1 a Simplify and factor. = a(a+3) a Divide by the common factor a. = a+3 Average rate of change = g(a)−g(0) a−0 Evaluate. = ( a 2 +3a+1)−( 0 2 +3(0)+1) a−0 Simplify. = a 2 +3a+1−1 a Simplify and factor. = a(a+3) a Divide by the common factor a. = a+3

This result tells us the average rate of change in terms of  a a between  t=0 t=0 and any other point  t=a. t=a. For example, on the interval  [0,5], [0,5], the average rate of change would be  5+3=8. 5+3=8.

###  Try It  #3

Find the average rate of change of  f(x)= x 2 +2x−8 f(x)= x 2 +2x−8 on the interval  [5,a] [5,a] in simplest forms in terms   
of  a. a.

### Using a Graph to Determine Where a Function is Increasing, Decreasing, or Constant

As part of exploring how functions change, we can identify intervals over which the function is changing in specific ways. We say that a function is increasing on an interval if the function values increase as the input values increase within that interval. Similarly, a function is decreasing on an interval if the function values decrease as the input values increase over that interval. The average rate of change of an increasing function is positive, and the average rate of change of a decreasing function is negative. [Figure 3](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_004>) shows examples of increasing and decreasing intervals on a function.

![Graph of a polynomial that shows the increasing and decreasing intervals and local maximum and minimum.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2b4a51292dddebeb0f3bde52be5f218c1d848982) Figure  3 The function  f( x )= x 3 −12x f( x )= x 3 −12x is increasing on  ( −∞,−2 ) ∪ ​ ​ ( 2,∞ ) ( −∞,−2 ) ∪ ​ ​ ( 2,∞ ) and is decreasing on  (−2,2). (−2,2).

While some functions are increasing (or decreasing) over their entire domain, many others are not. A value of the input where a function changes from increasing to decreasing (as we go from left to right, that is, as the input variable increases) is the location of a local maximum. The function value at that point is the local maximum. If a function has more than one, we say it has local maxima. Similarly, a value of the input where a function changes from decreasing to increasing as the input variable increases is the location of a local minimum. The function value at that point is the local minimum. The plural form is “local minima.” Together, local maxima and minima are called local extrema, or local extreme values, of the function. (The singular form is “extremum.”) Often, the term _local_ is replaced by the term _relative_. In this text, we will use the term _local_.

Clearly, a function is neither increasing nor decreasing on an interval where it is constant. A function is also neither increasing nor decreasing at extrema. Note that we have to speak of _local_ extrema, because any given local extremum as defined here is not necessarily the highest maximum or lowest minimum in the function’s entire domain.

For the function whose graph is shown in [Figure 4](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_015>), the local maximum is 16, and it occurs at  x=−2. x=−2. The local minimum is  −16 −16 and it occurs at  x=2. x=2.

![A graph is shown on a set of x and y axes. The scale is minus five to plus five for x and minus twenty to twenty for y. The graph rises from below in the third quadrant, crossing the x-axis between negative three and negative four, has a turning point at minus two, sixteen, crosses the x-axis again at the origin, has another turning point at two, minus sixteen, and crosses the x-axis one last time between three and four, rising from there. The turning points are labeled local maximum and local minimum respectively. The curve is labeled increasing or decreasing as appropriate.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ba4ce1eb03371cb9667dec7cdec51a21feb13277) Figure  4

To locate the local maxima and minima from a graph, we need to observe the graph to determine where the graph attains its highest and lowest points, respectively, within an open interval. Like the summit of a roller coaster, the graph of a function is higher at a local maximum than at nearby points on both sides. The graph will also be lower at a local minimum than at neighboring points. [Figure 5](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_005>) illustrates these ideas for a local maximum.

![Graph of a polynomial that shows the increasing and decreasing intervals and local maximum.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/151daece91ddcd0ad086eb4a6a63f0dedfd44ac1) Figure  5 Definition of a local maximum

These observations lead us to a formal definition of local extrema.

###  Local Minima and Local Maxima

A function  f f is an increasing function on an open interval if  f( b )>f( a ) f( b )>f( a ) for any two input values  a a and  b b in the given interval where  b>a. b>a.

A function  f f is a decreasing function on an open interval if  f( b )<f( a ) f( b )<f( a ) for any two input values  a a and  b b in the given interval where  b>a. b>a.

A function  f f has a local maximum at  x=b x=b if there exists an interval  (a,c) (a,c) with  a<b<c a<b<c such that, for any  x x in the interval  ( a,c ), ( a,c ), f( x )≤f( b ). f( x )≤f( b ). Likewise,  f f has a local minimum at  x=b x=b if there exists an interval  (a,c) (a,c) with  a<b<c a<b<c such that, for any  x x in the interval  ( a,c ), ( a,c ), f( x )≥f( b ). f( x )≥f( b ).

###  Example  7

#### Finding Increasing and Decreasing Intervals on a Graph

Given the function  p( t ) p( t ) in [Figure 6](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_006>), identify the intervals on which the function appears to be increasing.

![Graph of a polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/dab6d2577d252f65a3a3cd76c792f97abc482af3) Figure  6

####  Solution

We see that the function is not constant on any interval. The function is increasing where it slants upward as we move to the right and decreasing where it slants downward as we move to the right. The function appears to be increasing from  t=1 t=1 to  t=3 t=3 and from  t=4 t=4 on. 

In interval notation, we would say the function appears to be increasing on the interval (1,3) and the interval  (4,∞). (4,∞).

#### Analysis 

Notice in this example that we used open intervals (intervals that do not include the endpoints), because the function is neither increasing nor decreasing at  t=1 t=1 ,  t=3 t=3 , and  t=4 t=4 . These points are the local extrema (two minima and a maximum). 

###  Example  8

#### Finding Local Extrema from a Graph

Graph the function  f( x )= 2 x + x 3 . f( x )= 2 x + x 3 . Then use the graph to estimate the local extrema of the function and to determine the intervals on which the function is increasing.

####  Solution

Using technology, we find that the graph of the function looks like that in [Figure 7](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_007>). It appears there is a low point, or local minimum, between  x=2 x=2 and  x=3, x=3, and a mirror-image high point, or local maximum, somewhere between  x=−3 x=−3 and  x=−2. x=−2.

![Graph of a reciprocal function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/241fa93a9ce8124d48204ada8fe6c8edfa4b69e0) Figure  7

#### Analysis 

Most graphing calculators and graphing utilities can estimate the location of maxima and minima. [Figure 8](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_008>) provides screen images from two different technologies, showing the estimate for the local maximum and minimum.

![Graph of the reciprocal function on a graphing calculator.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/68d233dde4fb504a6ed7c8b93d12bc1b5306f55f) Figure  8

Based on these estimates, the function is increasing on the interval  (−∞,−2.449) (−∞,−2.449) and  (2.449,∞). (2.449,∞). Notice that, while we expect the extrema to be symmetric, the two different technologies agree only up to four decimals due to the differing approximation algorithms used by each. (The exact location of the extrema is at  ± 6 , ± 6 , but determining this requires calculus.)

###  Try It  #4

Graph the function  f( x )= x 3 −6 x 2 −15x+20 f( x )= x 3 −6 x 2 −15x+20 to estimate the local extrema of the function. Use these to determine the intervals on which the function is increasing and decreasing.

###  Example  9

#### Finding Local Maxima and Minima from a Graph

For the function  f f whose graph is shown in [Figure 9](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_011>), find all local maxima and minima.

![Graph of a polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2addb41469229c8466f45cbccda65866650c2c47) Figure  9

####  Solution

Observe the graph of  f. f. The graph attains a local maximum at  x=1 x=1 because it is the highest point in an open interval around  x=1. x=1. The local maximum is the  y y -coordinate at  x=1, x=1, which is  2. 2.

The graph attains a local minimum at  x=−1 x=−1 because it is the lowest point in an open interval around  x=−1. x=−1. The local minimum is the _y_ -coordinate at  x=−1, x=−1, which is  −2. −2.

### Analyzing the Toolkit Functions for Increasing or Decreasing Intervals 

We will now return to our toolkit functions and discuss their graphical behavior in [Figure 10](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_012>), [Figure 11](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_016>), and [Figure 12](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_017>).

![Table showing the increasing and decreasing intervals of the toolkit functions.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f22b41248dd22d00a63dcb02f358ed1391fb7eca) Figure  10

![Table showing the increasing and decreasing intervals of the toolkit functions.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a67cdc93a5dc0fbc3016a4949587f64a835c309a) Figure  11

![Table showing the increasing and decreasing intervals of the toolkit functions.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/cb19bea012bc887dec6e4cc83ebcfd51da042cd0) Figure  12

###  Use A Graph to Locate the Absolute Maximum and Absolute Minimum

There is a difference between locating the highest and lowest points on a graph in a region around an open interval (locally) and locating the highest and lowest points on the graph for the entire domain. The  y- y- coordinates (output) at the highest and lowest points are called the **absolute maximum** and**absolute minimum** , respectively.

To locate absolute maxima and minima from a graph, we need to observe the graph to determine where the graph attains it highest and lowest points on the domain of the function. See [Figure 13](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_014>).

![Graph of a segment of a parabola with an absolute minimum at \(0, -2\) and absolute maximum at \(2, 2\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/bb08f4a7682898031911c3e11d4103b49d309391) Figure  13

Not every function has an absolute maximum or minimum value. The toolkit function  f( x )= x 3 f( x )= x 3 is one such function.

###  Absolute Maxima and Minima

The absolute maximum of  f f at  x=c x=c is  f( c ) f( c ) where  f( c )≥f( x ) f( c )≥f( x ) for all  x x in the domain of  f. f.

The absolute minimum of  f f at  x=d x=d is  f( d ) f( d ) where  f( d )≤f( x ) f( d )≤f( x ) for all  x x in the domain of  f. f.

###  Example  10

#### Finding Absolute Maxima and Minima from a Graph

For the function  f f shown in [Figure 14](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_013>), find all absolute maxima and minima.

![Graph of a polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/913701fd366ea33bac8906953907480a87bfd2cf) Figure  14

####  Solution

Observe the graph of  f. f. The graph attains an absolute maximum in two locations,  x=−2 x=−2 and  x=2, x=2, because at these locations, the graph attains its highest point on the domain of the function. The absolute maximum is the _y_ -coordinate at  x=−2 x=−2 and  x=2, x=2, which is  16. 16.

The graph attains an absolute minimum at  x=3, x=3, because it is the lowest point on the domain of the function’s graph. The absolute minimum is the _y_ -coordinate at  x=3, x=3, which is  −10. −10.

###  Media

Access this online resource for additional instruction and practice with rates of change.

  * [Average Rate of Change](<http://openstax.org/l/aroc>)

###  3.3 Section Exercises

#### Verbal

[1](<chapter-3>). 

Can the average rate of change of a function be constant?

2. 

If a function  f f is increasing on  (a,b) (a,b) and decreasing on  (b,c), (b,c), then what can be said about the local extremum of  f f on  (a,c)? (a,c)?

[3](<chapter-3>). 

How are the absolute maximum and minimum similar to and different from the local extrema?

4. 

How does the graph of the absolute value function compare to the graph of the quadratic function,  y= x 2 , y= x 2 , in terms of increasing and decreasing intervals?

#### Algebraic

For the following exercises, find the average rate of change of each function on the interval specified for real numbers  b b or  h h in simplest form. 

[5](<chapter-3>). 

f( x )=4 x 2 −7 f( x )=4 x 2 −7 on  [1,b] [1,b]

6. 

g( x )=2 x 2 −9 g( x )=2 x 2 −9 on  [ 4,b ] [ 4,b ]

[7](<chapter-3>). 

p( x )=3x+4 p( x )=3x+4 on  [2,2+h] [2,2+h]

8. 

k( x )=4x−2 k( x )=4x−2 on  [3,3+h] [3,3+h]

[9](<chapter-3>). 

f( x )=2 x 2 +1 f( x )=2 x 2 +1 on  [x,x+h] [x,x+h]

10. 

g( x )=3 x 2 −2 g( x )=3 x 2 −2 on  [x,x+h] [x,x+h]

[11](<chapter-3>). 

a( t )= 1 t+4 a( t )= 1 t+4 on  [9,9+h] [9,9+h]

12. 

b( x )= 1 x+3 b( x )= 1 x+3 on  [1,1+h] [1,1+h]

[13](<chapter-3>). 

j( x )=3 x 3 j( x )=3 x 3 on  [1,1+h] [1,1+h]

14. 

r( t )=4 t 3 r( t )=4 t 3 on  [2,2+h] [2,2+h]

[15](<chapter-3>). 

f( x+h )−f( x ) h f( x+h )−f( x ) h given  f( x )=2 x 2 −3x f( x )=2 x 2 −3x on  [x,x+h] [x,x+h]

#### Graphical

For the following exercises, consider the graph of  f f shown in [Figure 15](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_201>).

![Graph of a polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/73cd5a48bb91dbf8dbf1478f9efc0686a04ab7e0) Figure  15

16. 

Estimate the average rate of change from  x=1 x=1 to  x=4. x=4.

[17](<chapter-3>). 

Estimate the average rate of change from  x=2 x=2 to  x=5. x=5.

For the following exercises, use the graph of each function to estimate the intervals on which the function is increasing or decreasing.

18. 

![Graph of an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e9920b2ba7a6acb783edd2812681c8da3d2a6d5e)

[19](<chapter-3>). 

![Graph of a cubic function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/596e25da779ae78e216fe7d9d7614597b961049b)

20. 

![Graph of a cubic function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/828460680d2cfaab71f3b9f8696869b0daf49f6e)

[21](<chapter-3>). 

![Graph of a reciprocal function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f9bfc1f9c1c350cb26cc99ffdb54cd1d53f7f0e9)

For the following exercises, consider the graph shown in [Figure 16](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_206>).

![Graph of a cubic function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0a5c261db534dacd57d38c601c0162cbada04aa5) Figure  16

22. 

Estimate the intervals where the function is increasing or decreasing.

[23](<chapter-3>). 

Estimate the point(s) at which the graph of  f f has a local maximum or a local minimum.

For the following exercises, consider the graph in [Figure 17](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_207>).

![Graph of a cubic function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7c9a75bd9d8aaf4b1aa4753da8cca443661634dc) Figure  17

24. 

If the complete graph of the function is shown, estimate the intervals where the function is increasing or decreasing.

[25](<chapter-3>). 

If the complete graph of the function is shown, estimate the absolute maximum and absolute minimum.

#### Numeric

26. 

[Table 3](<3-3-rates-of-change-and-behavior-of-graphs#Table_01_03_03>) gives the annual sales (in millions of dollars) of a product from 1998 to 2006. What was the average rate of change of annual sales (a) between 2001 and 2002, and (b) between 2001 and 2004?

**Year** | **Sales  
(millions of dollars)**  
---|---  
1998| 201  
1999| 219  
2000| 233  
2001| 243  
2002| 249  
2003| 251  
2004| 249  
2005| 243  
2006| 233  
  
Table  3

[27](<chapter-3>). 

[Table 4](<3-3-rates-of-change-and-behavior-of-graphs#Table_01_03_04>) gives the population of a town (in thousands) from 2000 to 2008. What was the average rate of change of population (a) between 2002 and 2004, and (b) between 2002 and 2006?

**Year** | **Population  
(thousands)**  
---|---  
2000| 87  
2001| 84  
2002| 83  
2003| 80  
2004| 77  
2005| 76  
2006| 78  
2007| 81  
2008| 85  
  
Table  4

For the following exercises, find the average rate of change of each function on the interval specified.

28. 

f( x )= x 2 f( x )= x 2 on  [1,5] [1,5]

[29](<chapter-3>). 

h( x )=5−2 x 2 h( x )=5−2 x 2 on  [−2,4] [−2,4]

30. 

q( x )= x 3 q( x )= x 3 on  [−4,2] [−4,2]

[31](<chapter-3>). 

g( x )=3 x 3 −1 g( x )=3 x 3 −1 on  [−3,3] [−3,3]

32. 

y= 1 x y= 1 x on  [1,3] [1,3]

[33](<chapter-3>). 

p( t )= ( t 2 −4 )( t+1 ) t 2 +3 p( t )= ( t 2 −4 )( t+1 ) t 2 +3 on  [−3,1] [−3,1]

34. 

k( t )=6 t 2 + 4 t 3 k( t )=6 t 2 + 4 t 3 on  [−1,3] [−1,3]

#### Technology

For the following exercises, use a graphing utility to estimate the local extrema of each function and to estimate the intervals on which the function is increasing and decreasing.

[35](<chapter-3>). 

f( x )= x 4 −4 x 3 +5 f( x )= x 4 −4 x 3 +5

36. 

h( x )= x 5 +5 x 4 +10 x 3 +10 x 2 −1 h( x )= x 5 +5 x 4 +10 x 3 +10 x 2 −1

[37](<chapter-3>). 

g( t )=t t+3 g( t )=t t+3

38. 

k( t )=3 t 2 3 −t k( t )=3 t 2 3 −t

[39](<chapter-3>). 

m( x )= x 4 +2 x 3 −12 x 2 −10x+4 m( x )= x 4 +2 x 3 −12 x 2 −10x+4

40. 

n( x )= x 4 −8 x 3 +18 x 2 −6x+2 n( x )= x 4 −8 x 3 +18 x 2 −6x+2

#### Extension

[41](<chapter-3>). 

The graph of the function  f f is shown in [Figure 18](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_213>).

![Graph of f\(x\) on a graphing calculator.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9726fa94a9dfa3bd43f4e18a5fb08182f4a0d007) Figure  18

Based on the calculator screen shot, the point  (1.333,5.185) (1.333,5.185) is which of the following?

  1. ⓐa relative (local) maximum of the function
  2. ⓑthe vertex of the function
  3. ⓒthe absolute maximum of the function
  4. ⓓa zero of the function

42. 

Let  f(x)= 1 x . f(x)= 1 x . Find a number  c c such that the average rate of change of the function  f f on the interval  (1,c) (1,c) is  − 1 4 . − 1 4 .

[43](<chapter-3>). 

Let  f( x )= 1 x f( x )= 1 x . Find the number  b b such that the average rate of change of  f f on the interval  (2,b) (2,b) is  − 1 10 . − 1 10 .

#### Real-World Applications

44. 

At the start of a trip, the odometer on a car read 21,395. At the end of the trip, 13.5 hours later, the odometer read 22,125. Assume the scale on the odometer is in miles. What is the average speed the car traveled during this trip?

[45](<chapter-3>). 

A driver of a car stopped at a gas station to fill up his gas tank. He looked at his watch, and the time read exactly 3:40 p.m. At this time, he started pumping gas into the tank. At exactly 3:44, the tank was full and he noticed that he had pumped 10.7 gallons. What is the average rate of flow of the gasoline into the gas tank?

46. 

Near the surface of the moon, the distance that an object falls is a function of time. It is given by  d( t )=2.6667 t 2 , d( t )=2.6667 t 2 , where  t t is in seconds and  d( t ) d( t ) is in feet. If an object is dropped from a certain height, find the average velocity of the object from  t=1 t=1 to  t=2. t=2.

[47](<chapter-3>). 

The graph in [Figure 19](<3-3-rates-of-change-and-behavior-of-graphs#Figure_01_03_214>) illustrates the decay of a radioactive substance over  t t days.

![Graph of an exponential function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/662a334a10bccee69b965313954bff5214b50dca) Figure  19

Use the graph to estimate the average decay rate from  t=5 t=5 to  t=15. t=15.

### Footnotes

  * 5<http://www.eia.gov/totalenergy/data/annual/showtext.cfm?t=ptb0524>. Accessed 3/5/2014.

