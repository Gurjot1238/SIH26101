# 1.6 Absolute Value Functions

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/1-6-absolute-value-functions
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 1.6 Absolute Value Functions

### Learning Objectives

In this section you will: 

  * Graph an absolute value function.
  * Solve an absolute value equation.
  * Solve an absolute value inequality.

![The Milky Way.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d78d5b954e217ab5e790857d208ec73c590c8781) Figure  1 Distances in deep space can be measured in all directions. As such, it is useful to consider distance in terms of absolute values. (credit: "s58y"/Flickr)

Until the 1920s, the so-called spiral nebulae were believed to be clouds of dust and gas in our own galaxy, some tens of thousands of light years away. Then, astronomer Edwin Hubble proved that these objects are galaxies in their own right, at distances of millions of light years. Today, astronomers can detect galaxies that are billions of light years away. Distances in the universe can be measured in all directions. As such, it is useful to consider distance as an absolute value function. In this section, we will investigate absolute value functions. 

### Understanding Absolute Value 

Recall that in its basic form  f(x)=| x |, f(x)=| x |, the absolute value function, is one of our toolkit functions. The absolute value function is commonly thought of as providing the distance the number is from zero on a number line. Algebraically, for whatever the input value is, the output is the value without regard to sign.

###  Absolute Value Function

The absolute value function can be defined as a piecewise function

f(x)=| x |={ x if x≥0 −x if x<0 f(x)=| x |={ x if x≥0 −x if x<0

###  Example  1

#### Determine a Number within a Prescribed Distance

Describe all values  x x within or including a distance of 4 from the number 5.

####  Solution

We want the distance between  x x and 5 to be less than or equal to 4. We can draw a number line, such as the one in [Figure 2](<1-6-absolute-value-functions#Figure_01_06_002>), to represent the condition to be satisfied.

![Number line describing the difference of the distance of 4 away from 5.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2c3f09a9213c8072d3abe9a30c0fc4083d6c7034) Figure  2

The distance from  x x to 5 can be represented using the absolute value as  | x−5 |. | x−5 |. We want the values of  x x that satisfy the condition  | x−5 |≤4. | x−5 |≤4.

#### Analysis 

Note that 

−4≤x−5 x−5≤4 1≤x x≤9 −4≤x−5 x−5≤4 1≤x x≤9

So  | x−5 |≤4 | x−5 |≤4 is equivalent to  1≤x≤9. 1≤x≤9.

However, mathematicians generally prefer absolute value notation.

###  Try It  #1

Describe all values  x x within a distance of 3 from the number 2.

###  Example  2

#### Resistance of a Resistor

Electrical parts, such as resistors and capacitors, come with specified values of their operating parameters: resistance, capacitance, etc. However, due to imprecision in manufacturing, the actual values of these parameters vary somewhat from piece to piece, even when they are supposed to be the same. The best that manufacturers can do is to try to guarantee that the variations will stay within a specified range, often  ±1%,±5%, ±1%,±5%, or  ±10%. ±10%.

Suppose we have a resistor rated at 680 ohms,  ±5%. ±5%. Use the absolute value function to express the range of possible values of the actual resistance.

####  Solution

5% of 680 ohms is 34 ohms. The absolute value of the difference between the actual and nominal resistance should not exceed the stated variability, so, with the resistance  R R in ohms,

| R−680 |≤34 | R−680 |≤34

###  Try It  #2

Students who score within 20 points of 80 will pass a test. Write this as a distance from 80 using absolute value notation. 

### Graphing an Absolute Value Function

The most significant feature of the absolute value graph is the corner point at which the graph changes direction. This point is shown at the origin in [Figure 3](<1-6-absolute-value-functions#Figure_01_06_003>).

![Graph of an absolute function](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/f97d1919a813c2fd5ca42cf569cc617b01695d32) Figure  3

[Figure 4](<1-6-absolute-value-functions#Figure_01_06_004>) shows the graph of  y=2| x–3 |+4. y=2| x–3 |+4. The graph of  y=| x | y=| x | has been shifted right 3 units, vertically stretched by a factor of 2, and shifted up 4 units. This means that the corner point is located at  ( 3,4 ) ( 3,4 ) for this transformed function.

![Graph of the different types of transformations for an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/eab2f14a4a60fd1c639b2f1f8d74897f67c6c7b9) Figure  4

###  Example  3

#### Writing an Equation for an Absolute Value Function

Write an equation for the function graphed in [Figure 5](<1-6-absolute-value-functions#Figure_01_06_005>).

![Graph of an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7ac2f2030e89ac3e8e167a27f9acc82966bc691a) Figure  5

####  Solution

The basic absolute value function changes direction at the origin, so this graph has been shifted to the right 3 units and down 2 units from the basic toolkit function. See [Figure 6](<1-6-absolute-value-functions#Figure_01_06_006>).

![Graph of two transformations for an absolute function at \(3, -2\).](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ccf016bcce1dfbda630ffbaf613a2da35b8643f7) Figure  6

We also notice that the graph appears vertically stretched, because the width of the final graph on a horizontal line is not equal to 2 times the vertical distance from the corner to this line, as it would be for an unstretched absolute value function. Instead, the width is equal to 1 times the vertical distance as shown in [Figure 7](<1-6-absolute-value-functions#Figure_01_06_007>).

![Graph of two transformations for an absolute function at \(3, -2\) and describes the ratios between the two different transformations.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/b405c358c2b8ac8c427059ba141ddcd94638b24f) Figure  7

From this information we can write the equation

f(x)=2|x−3|−2, treating the stretch as a vertical stretch, or f(x)=|2(x−3)|−2, treating the stretch as a horizontal compression. f(x)=2|x−3|−2, treating the stretch as a vertical stretch, or f(x)=|2(x−3)|−2, treating the stretch as a horizontal compression.

#### Analysis 

Note that these equations are algebraically equivalent—the stretch for an absolute value function can be written interchangeably as a vertical or horizontal stretch or compression. Note also that if the vertical stretch factor is negative, there is also a reflection about the x-axis.

###  Q&A

**If we couldn’t observe the stretch of the function from the graphs, could we algebraically determine it?**

_Yes. If we are unable to determine the stretch based on the width of the graph, we can solve for the stretch factor by putting in a known pair of values for x x and  f(x). f(x). _

f(x)=a|x−3|−2 f(x)=a|x−3|−2

_Now substituting in the point_(1, 2)

2=a| 1−3 |−2 4=2a a=2 2=a| 1−3 |−2 4=2a a=2

###  Try It  #3

Write the equation for the absolute value function that is horizontally shifted left 2 units, is vertically flipped, and vertically shifted up 3 units. 

###  Q&A

**Do the graphs of absolute value functions always intersect the vertical axis? The horizontal axis?**

_Yes, they always intersect the vertical axis. The graph of an absolute value function will intersect the vertical axis when the input is zero._

_No, they do not always intersect the horizontal axis. The graph may or may not intersect the horizontal axis, depending on how the graph has been shifted and reflected. It is possible for the absolute value function to intersect the horizontal axis at zero, one, or two points (see[Figure 8](<1-6-absolute-value-functions#Figure_01_06_008>)). _

![Graph of the different types of transformations for an absolute function.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8a0ca61ad51ad9e536dc9ff2849867f7d264b999) Figure  8 (a) The absolute value function does not intersect the horizontal axis. (b) The absolute value function intersects the horizontal axis at one point. (c) The absolute value function intersects the horizontal axis at two points.

### Solving an Absolute Value Equation

Now that we can graph an absolute value function, we will learn how to solve an absolute value equation. To solve an equation such as  8=| 2x−6 |, 8=| 2x−6 |, we notice that the absolute value will be equal to 8 if the quantity inside the absolute value is 8 or -8. This leads to two different equations we can solve independently.

2x−6=8 or 2x−6=−8 2x=14 2x=−2 x=7 x=−1 2x−6=8 or 2x−6=−8 2x=14 2x=−2 x=7 x=−1

Knowing how to solve problems involving absolute value functions is useful. For example, we may need to identify numbers or points on a line that are at a specified distance from a given reference point.

An absolute value equation is an equation in which the unknown variable appears in absolute value bars. For example,

| x |=4, | 2x−1 |=3 | 5x+2 |−4=9 | x |=4, | 2x−1 |=3 | 5x+2 |−4=9

###  Solutions to Absolute Value Equations

For real numbers  A A and  B, B, an equation of the form  | A |=B, | A |=B, with  B≥0, B≥0, will have solutions when  A=B A=B or  A=−B. A=−B. If  B<0, B<0, the equation  | A |=B | A |=B has no solution.

###  How To

**Given the formula for an absolute value function, find the horizontal intercepts of its graph**.

  1. Isolate the absolute value term.
  2. Use  | A |=B | A |=B to write  A=B A=B or  −A=B, −A=B, assuming  B>0. B>0.
  3. Solve for  x. x.

###  Example  4

#### Finding the Zeros of an Absolute Value Function

For the function  f(x)=| 4x+1 |−7 f(x)=| 4x+1 |−7, find the values of xx such that f(x)=0 f(x)=0 . 

####  Solution

0=|4x+1|−7 0=|4x+1|−7 | Substitute 0 for f(x).  
---|---  
7=|4x+1| 7=|4x+1| | Isolate the absolute value on one side of the equation.  
7=4x+1 or −7=4x+1 6=4x −8=4x x= 6 4 =1.5 x= −8 4 =−2 7=4x+1 or −7=4x+1 6=4x −8=4x x= 6 4 =1.5 x= −8 4 =−2 | Break into two separate equations and solve.  
  
The function outputs 0 when  x=1.5 x=1.5 or  x=−2. x=−2. See [Figure 9](<1-6-absolute-value-functions#Figure_01_06_011>). 

![Graph an absolute function with x-intercepts at -2 and 1.5.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/d7a0c088c8378efda1ca1ad0cd472cd5de5388dc) Figure  9

###  Try It  #4

For the function  f(x)=| 2x−1 |−3, f(x)=| 2x−1 |−3, find the values of  x x such that  f(x)=0. f(x)=0.

###  Q&A

**Should we always expect two answers when solving | A |=B? | A |=B? **

_No. We may find one, two, or even no answers. For example, there is no solution to_ 2+| 3x−5 |=1. 2+| 3x−5 |=1.

###  How To

**Given an absolute value equation, solve it.**

  1. Isolate the absolute value term.
  2. Use  | A |=B | A |=B to write  A=B A=B or  A=−B. A=−B.
  3. Solve for  x. x.

###  Example  5

#### Solving an Absolute Value Equation

Solve  1=4| x−2 |+2. 1=4| x−2 |+2.

####  Solution

Isolating the absolute value on one side of the equation gives the following.

1=4| x−2 |+2 −1=4| x−2 | − 1 4 =| x−2 | 1=4| x−2 |+2 −1=4| x−2 | − 1 4 =| x−2 |

The absolute value always returns a positive value, so it is impossible for the absolute value to equal a negative value. At this point, we notice that this equation has no solutions.

###  Q&A

**In[Example 5](<1-6-absolute-value-functions#Example_01_06_05>), if  f(x)=1 f(x)=1 and  g(x)=4| x−2 |+2 g(x)=4| x−2 |+2 were graphed on the same set of axes, would the graphs intersect?**

_No. The graphs of f f and  g g would not intersect, as shown in [Figure 10](<1-6-absolute-value-functions#Figure_01_06_012>). This confirms, graphically, that the equation  1=4| x−2 |+2 1=4| x−2 |+2 has no solution._

![Graph of g\(x\)=4|x-2|+2 and f\(x\)=1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/720c1aa3804eb026998dd609bea7d9d98ef44218) Figure  10

###  Try It  #5

Find where the graph of the function  f(x)=−| x+2 |+3 f(x)=−| x+2 |+3 intersects the horizontal and vertical axes.

### Solving an Absolute Value Inequality

Absolute value equations may not always involve equalities. Instead, we may need to solve an equation within a range of values. We would use an absolute value inequality to solve such an equation. An absolute value inequality is an equation of the form

|A|<B,|A|≤B,|A|>B,or|A|≥B, |A|<B,|A|≤B,|A|>B,or|A|≥B,

where an expression  A A (and possibly but not usually  B B ) depends on a variable  x. x. Solving the inequality means finding the set of all  x x that satisfy the inequality. Usually this set will be an interval or the union of two intervals.

There are two basic approaches to solving absolute value inequalities: graphical and algebraic. The advantage of the graphical approach is we can read the solution by interpreting the graphs of two functions. The advantage of the algebraic approach is it yields solutions that may be difficult to read from the graph.

For example, we know that all numbers within 200 units of 0 may be expressed as

| x |<200or−200<x<200 | x |<200or−200<x<200

Suppose we want to know all possible returns on an investment if we could earn some amount of money within $200 of $600. We can solve algebraically for the set of values  x x such that the distance between  x x and 600 is less than 200. We represent the distance between  x x and 600 as  | x−600 |. | x−600 |.

|x−600|<200 or −200<x−600<200 −200+600<x−600+600<200+600 400<x<800 |x−600|<200 or −200<x−600<200 −200+600<x−600+600<200+600 400<x<800

This means our returns would be between $400 and $800.

Sometimes an absolute value inequality problem will be presented to us in terms of a shifted and/or stretched or compressed absolute value function, where we must determine for which values of the input the function’s output will be negative or positive.

###  How To

**Given an absolute value inequality of the form | x−A |≤B | x−A |≤B for real numbers  a a and  b b where  b b is positive, solve the absolute value inequality algebraically.**

  1. Find boundary points by solving  | x−A |=B. | x−A |=B.
  2. Test intervals created by the boundary points to determine where  | x−A |≤B. | x−A |≤B.
  3. Write the interval or union of intervals satisfying the inequality in interval, inequality, or set-builder notation.

###  Example  6

#### Solving an Absolute Value Inequality

Solve  |x−5|<4. |x−5|<4.

####  Solution

With both approaches, we will need to know first where the corresponding equality is true. In this case we first will find where  | x−5 |=4. | x−5 |=4. We do this because the absolute value is a function with no breaks, so the only way the function values can switch from being less than 4 to being greater than 4 is by passing through where the values equal 4. Solve  | x−5 |=4. | x−5 |=4.

x−5=4 x=9 or x−5=−4 x=1 x−5=4 x=9 or x−5=−4 x=1

After determining that the absolute value is equal to 4 at  x=1 x=1 and  x=9, x=9, we know the graph can change only from being less than 4 to greater than 4 at these values. This divides the number line up into three intervals:

x<1,1<x<9, and x>9. x<1,1<x<9, and x>9.

To determine when the function is less than 4, we could choose a value in each interval and see if the output is less than or greater than 4, as shown in [Table 1](<1-6-absolute-value-functions#Table_01_06_01>).

Interval test  x x |  f(x) f(x) |  <4 <4 or  >4? >4?  
---|---|---  
x<1 x<1 | 0 |  | 0−5 |=5 | 0−5 |=5 | Greater than  
1<x<9 1<x<9 | 6 |  | 6−5 |=1 | 6−5 |=1 | Less than  
x>9 x>9 | 11 |  | 11−5 |=6 | 11−5 |=6 | Greater than  
  
Table  1

Because  1<x<9 1<x<9 is the only interval in which the output at the test value is less than 4, we can conclude that the solution to  | x−5 |<4 | x−5 |<4 is  1<x<9, 1<x<9, or  ( 1,9 ). ( 1,9 ).

To use a graph, we can sketch the function  f(x)=| x−5 |. f(x)=| x−5 |. To help us see where the outputs are 4, the line  g(x)=4 g(x)=4 could also be sketched as in [Figure 11](<1-6-absolute-value-functions#Figure_01_06_013>).

![Graph of an absolute function and a vertical line, demonstrating how to see what outputs are less than the vertical line.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/2ca877c5ed37196ffa7dc2b34b92442d97cb73b4) Figure  11 Graph to find the points satisfying an absolute value inequality.

We can see the following:

  * The output values of the absolute value are equal to 4 at  x=1 x=1 and  x=9. x=9.
  * The graph of  f f is below the graph of  g g on  1<x<9. 1<x<9. This means the output values of  f(x) f(x) are less than the output values of  g(x). g(x).
  * The absolute value is less than or equal to 4 between these two points, when  1<x<9. 1<x<9. In interval notation, this would be the interval  ( 1,9 ). ( 1,9 ).

#### Analysis 

For absolute value inequalities,

|x−A|<C, |x−A|>C, −C<x−A<C, x−A<−C or x−A>C. |x−A|<C, |x−A|>C, −C<x−A<C, x−A<−C or x−A>C.

The  < < or  > > symbol may be replaced by  ≤ or ≥. ≤ or ≥.

So, for this example, we could use this alternative approach.

|x−5|<4 −4<x−5<4 Rewrite by removing the absolute value bars. −4+5<x−5+5<4+5 Isolate the x. 1<x<9 |x−5|<4 −4<x−5<4 Rewrite by removing the absolute value bars. −4+5<x−5+5<4+5 Isolate the x. 1<x<9

###  Try It  #6

Solve  | x+2 |≤6. | x+2 |≤6.

###  How To

**Given an absolute value function, solve for the set of inputs where the output is positive (or negative).**

  1. Set the function equal to zero, and solve for the boundary points of the solution set.
  2. Use test points or a graph to determine where the function’s output is positive or negative.

###  Example  7

#### Using a Graphical Approach to Solve Absolute Value Inequalities

Given the function  f(x)=− 1 2 | 4x−5 |+3, f(x)=− 1 2 | 4x−5 |+3, determine the  x- x- values for which the function values are negative.

####  Solution

We are trying to determine where  f(x)<0, f(x)<0, which is when  − 1 2 |4x−5|+3<0. − 1 2 |4x−5|+3<0. We begin by isolating the absolute value.

− 1 2 |4x−5|<−3 Multiply both sides by –2, and reverse the inequality. |4x−5|>6 − 1 2 |4x−5|<−3 Multiply both sides by –2, and reverse the inequality. |4x−5|>6

Next we solve for the equality  | 4x−5 |=6. | 4x−5 |=6.

4x−5=6 or 4x−5=−6 4x−5=6 4x=−1 x= 11 4 x=− 1 4 4x−5=6 or 4x−5=−6 4x−5=6 4x=−1 x= 11 4 x=− 1 4

Now, we can examine the graph of  f f to observe where the output is negative. We will observe where the branches are below the _x_ -axis. Notice that it is not even important exactly what the graph looks like, as long as we know that it crosses the horizontal axis at  x=− 1 4 x=− 1 4 and  x= 11 4 x= 11 4 and that the graph has been reflected vertically. See [Figure 12](<1-6-absolute-value-functions#Figure_01_06_014>)**.**

![Graph of an absolute function with x-intercepts at -0.25 and 2.75.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ff95206962696785b3b2f24db7cbf7c68ac68a48) Figure  12

We observe that the graph of the function is below the _x_ -axis left of  x=− 1 4 x=− 1 4 and right of  x= 11 4 . x= 11 4 . This means the function values are negative to the left of the first horizontal intercept at  x=− 1 4 , x=− 1 4 , and negative to the right of the second intercept at  x= 11 4 . x= 11 4 . This gives us the solution to the inequality.

x<− 1 4 or x> 11 4 x<− 1 4 or x> 11 4

In interval notation, this would be  ( −∞,−0.25 )∪( 2.75,∞ ). ( −∞,−0.25 )∪( 2.75,∞ ).

###  Try It  #7

Solve  −2| k−4 |≤−6. −2| k−4 |≤−6.

###  Media

Access these online resources for additional instruction and practice with absolute value.

  * [Graphing Absolute Value Functions](<http://openstax.org/l/graphabsvalue>)
  * [Graphing Absolute Value Functions 2](<http://openstax.org/l/graphabsvalue2>)
  * [Equations of Absolute Value Function](<http://openstax.org/l/findeqabsval>)
  * [Equations of Absolute Value Function 2](<http://openstax.org/l/findeqabsval2>)
  * [Solving Absolute Value Equations](<http://openstax.org/l/solveabsvalueeq>)

###  1.6 Section Exercises

#### Verbal

[1](<chapter-1>). 

How do you solve an absolute value equation?

2. 

How can you tell whether an absolute value function has two _x_ -intercepts without graphing the function?

[3](<chapter-1>). 

When solving an absolute value function, the isolated absolute value term is equal to a negative number. What does that tell you about the graph of the absolute value function?

4. 

How can you use the graph of an absolute value function to determine the _x_ -values for which the function values are negative?

[5](<chapter-1>). 

How do you solve an absolute value inequality algebraically?

#### Algebraic

6. 

Describe all numbers  x x that are at a distance of 4 from the number 8. Express this using absolute value notation.

[7](<chapter-1>). 

Describe all numbers  x x that are at a distance of  1 2 1 2 from the number −4. Express this using absolute value notation.

8. 

Describe the situation in which the distance that point  x x is from 10 is at least 15 units. Express this using absolute value notation.

[9](<chapter-1>). 

Find all function values  f(x) f(x) such that the distance from  f(x) f(x) to the value 8 is less than 0.03 units. Express this using absolute value notation.

For the following exercises, solve the equations below and express the answer using set notation.

10. 

|x+3|=9 |x+3|=9

[11](<chapter-1>). 

|6−x|=5 |6−x|=5

12. 

|5x−2|=11 |5x−2|=11

[13](<chapter-1>). 

|4x−2|=11 |4x−2|=11

14. 

2|4−x|=7 2|4−x|=7

[15](<chapter-1>). 

3|5−x|=5 3|5−x|=5

16. 

3|x+1|−4=5 3|x+1|−4=5

[17](<chapter-1>). 

5| x−4 |−7=2 5| x−4 |−7=2

18. 

0=−| x−3 |+2 0=−| x−3 |+2

[19](<chapter-1>). 

2| x−3 |+1=2 2| x−3 |+1=2

20. 

| 3x−2 |=7 | 3x−2 |=7

[21](<chapter-1>). 

| 3x−2 |=−7 | 3x−2 |=−7

22. 

| 1 2 x−5 |=11 | 1 2 x−5 |=11

[23](<chapter-1>). 

| 1 3 x+5 |=14 | 1 3 x+5 |=14

24. 

−| 1 3 x+5 |+14=0 −| 1 3 x+5 |+14=0

For the following exercises, find the _x_ \- and _y_ -intercepts of the graphs of each function.

[25](<chapter-1>). 

f(x)=2| x+1 |−10 f(x)=2| x+1 |−10

26. 

f(x)=4| x−3 |+4 f(x)=4| x−3 |+4

[27](<chapter-1>). 

f(x)=−3| x−2 |−1 f(x)=−3| x−2 |−1

28. 

f(x)=−2| x+1 |+6 f(x)=−2| x+1 |+6

For the following exercises, solve each inequality and write the solution in interval notation.

[29](<chapter-1>). 

| x−2 |>10 | x−2 |>10

30. 

2| v−7 |−4≥42 2| v−7 |−4≥42

[31](<chapter-1>). 

| 3x−4 |≤8 | 3x−4 |≤8

32. 

| x−4 |≥8 | x−4 |≥8

[33](<chapter-1>). 

| 3x−5 |≥13 | 3x−5 |≥13

34. 

| 3x−5 |≥−13 | 3x−5 |≥−13

[35](<chapter-1>). 

| 3 4 x−5 |≥7 | 3 4 x−5 |≥7

36. 

| 3 4 x−5 |+1≤16 | 3 4 x−5 |+1≤16

#### Graphical

For the following exercises, graph the absolute value function. Plot at least five points by hand for each graph.

[37](<chapter-1>). 

y=|x−1| y=|x−1|

38. 

y=|x+1| y=|x+1|

[39](<chapter-1>). 

y=|x|+1 y=|x|+1

For the following exercises, graph the given functions by hand.

40. 

y=| x |−2 y=| x |−2

[41](<chapter-1>). 

y=−| x | y=−| x |

42. 

y=−| x |−2 y=−| x |−2

[43](<chapter-1>). 

y=−| x−3 |−2 y=−| x−3 |−2

44. 

f(x)=−|x−1|−2 f(x)=−|x−1|−2

[45](<chapter-1>). 

f(x)=−|x+3|+4 f(x)=−|x+3|+4

46. 

f(x)=2|x+3|+1 f(x)=2|x+3|+1

[47](<chapter-1>). 

f(x)=3| x−2 |+3 f(x)=3| x−2 |+3

48. 

f(x)=| 2x−4 |−3 f(x)=| 2x−4 |−3

[49](<chapter-1>). 

f( x )=| 3x+9 |+2 f( x )=| 3x+9 |+2

50. 

f(x)=−| x−1 |−3 f(x)=−| x−1 |−3

[51](<chapter-1>). 

f(x)=−| x+4 |−3 f(x)=−| x+4 |−3

52. 

f(x)= 1 2 | x+4 |−3 f(x)= 1 2 | x+4 |−3

#### Technology

[53](<chapter-1>). 

Use a graphing utility to graph  f(x)=10|x−2| f(x)=10|x−2| on the viewing window  [ 0,4 ]. [ 0,4 ]. Identify the corresponding range. Show the graph.

54. 

Use a graphing utility to graph  f(x)=−100|x|+100 f(x)=−100|x|+100 on the viewing window  [ −5,5 ]. [ −5,5 ]. Identify the corresponding range. Show the graph.

For the following exercises, graph each function using a graphing utility. Specify the viewing window.

[55](<chapter-1>). 

f(x)=−0.1| 0.1(0.2−x) |+0.3 f(x)=−0.1| 0.1(0.2−x) |+0.3

56. 

f(x)=4× 10 9 | x−(5× 10 9 ) |+2× 10 9 f(x)=4× 10 9 | x−(5× 10 9 ) |+2× 10 9

#### Extensions

For the following exercises, solve the inequality.

[57](<chapter-1>). 

|−2x− 2 3 (x+1)|+3>−1 |−2x− 2 3 (x+1)|+3>−1

58. 

If possible, find all values of  a a such that there are no  x- x- intercepts for  f(x)=2| x+1 |+a. f(x)=2| x+1 |+a.

[59](<chapter-1>). 

If possible, find all values of  a a such that there are no  y y-intercepts for  f(x)=2| x+1 |+a. f(x)=2| x+1 |+a.

#### Real-World Applications

60. 

Cities A and B are on the same east-west line. Assume that city A is located at the origin. If the distance from city A to city B is at least 100 miles and  x x represents the distance from city B to city A, express this using absolute value notation.

[61](<chapter-1>). 

The true proportion  p p of people who give a favorable rating to Congress is 8% with a margin of error of 1.5%. Describe this statement using an absolute value equation.

62. 

Students who score within 18 points of the number 82 will pass a particular test. Write this statement using absolute value notation and use the variable  x x for the score.

[63](<chapter-1>). 

A machinist must produce a bearing that is within 0.01 inches of the correct diameter of 5.0 inches. Using  x x as the diameter of the bearing, write this statement using absolute value notation. 

64. 

The tolerance for a ball bearing is 0.01. If the true diameter of the bearing is to be 2.0 inches and the measured value of the diameter is  x x inches, express the tolerance using absolute value notation.

