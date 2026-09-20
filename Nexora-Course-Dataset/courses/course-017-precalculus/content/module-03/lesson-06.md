# 3.5 Dividing Polynomials

> Source: Precalculus. OpenStax / Rice University.
> Official URL: https://openstax.org/books/precalculus/pages/3-5-dividing-polynomials
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 3.5 Dividing Polynomials

### Learning Objectives

In this section, you will:

  * Use long division to divide polynomials.
  * Use synthetic division to divide polynomials.

![Lincoln Memorial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/975951a618866688496b5d19f096409c6269b2d1) Figure  1 Lincoln Memorial, Washington, D.C. (credit: Ron Cogswell, Flickr)

The exterior of the Lincoln Memorial in Washington, D.C., is a large rectangular solid with length 61.5 meters (m), width 40 m, and height 30 m.[1](<3-5-dividing-polynomials#fs-id1165135149061>) We can easily find the volume using elementary geometry.

V=l⋅w⋅h =61.5⋅40⋅30 =73,800 V=l⋅w⋅h =61.5⋅40⋅30 =73,800

So the volume is 73,800 cubic meters  ( m³ ). ( m³ ). Suppose we knew the volume, length, and width. We could divide to find the height.

h= V l⋅w = 73,800 61.5⋅40 =30 h= V l⋅w = 73,800 61.5⋅40 =30

As we can confirm from the dimensions above, the height is 30 m. We can use similar methods to find any of the missing dimensions. We can also use the same method if any or all of the measurements contain variable expressions. For example, suppose the volume of a rectangular solid is given by the polynomial  3 x 4 −3 x 3 −33 x 2 +54x. 3 x 4 −3 x 3 −33 x 2 +54x. The length of the solid is given by  3x; 3x; the width is given by  x−2. x−2. To find the height of the solid, we can use polynomial division, which is the focus of this section.

### Using Long Division to Divide Polynomials

We are familiar with the long division algorithm for ordinary arithmetic. We begin by dividing into the digits of the dividend that have the greatest place value. We divide, multiply, subtract, include the digit in the next place value position, and repeat. For example, let’s divide 178 by 3 using long division.

![Steps of long division for intergers.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a3075d8a73f65e2ad04180a05fdea0723dc8cef6)

Another way to look at the solution is as a sum of parts. This should look familiar, since it is the same method used to check division in elementary arithmetic.

dividend = (divisor ⋅ quotient) \+ remainder 178=(3⋅59)+1 =177+1 =178 dividend = (divisor ⋅ quotient) \+ remainder 178=(3⋅59)+1 =177+1 =178

We call this the **Division Algorithm** and will discuss it more formally after looking at an example.

Division of polynomials that contain more than one term has similarities to long division of whole numbers. We can write a polynomial dividend as the product of the divisor and the quotient added to the remainder. The terms of the polynomial division correspond to the digits (and place values) of the whole number division. This method allows us to divide two polynomials. For example, if we were to divide  2 x 3 −3 x 2 +4x+5 2 x 3 −3 x 2 +4x+5 by  x+2 x+2 using the long division algorithm, it would look like this: 

![Steps of long division for polynomials.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6405515967a5671cb5ff219ec9a60a7a5aa0be94)

We have found

2 x 3 −3 x 2 +4x+5 x+2 =2 x 2 −7x+18− 31 x+2 2 x 3 −3 x 2 +4x+5 x+2 =2 x 2 −7x+18− 31 x+2

or

2 x 3 −3 x 2 +4x+5 =(x+2)(2 x 2 −7x+18)−31 2 x 3 −3 x 2 +4x+5 =(x+2)(2 x 2 −7x+18)−31

We can identify the dividend, the divisor, the quotient, and the remainder.

![Identifying the dividend, divisor, quotient and remainder of the polynomial 2x^3-3x^2+4x+5, which is the dividend.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fdefee7ce7430fca380493b18debaba5cf907531)

Writing the result in this manner illustrates the Division Algorithm.

###  The Division Algorithm

The Division Algorithm states that, given a polynomial dividend  f(x) f(x) and a non-zero polynomial divisor  d(x) d(x) where the degree of  d(x) d(x) is less than or equal to the degree of  f(x), f(x), there exist unique polynomials  q(x) q(x) and  r(x) r(x) such that

f(x)=d(x)q(x)+r(x) f(x)=d(x)q(x)+r(x)

q(x) q(x) is the quotient and  r(x) r(x) is the remainder. The remainder is either equal to zero or has degree strictly less than  d(x). d(x).

If  r(x)=0, r(x)=0, then  d(x) d(x) divides evenly into  f(x). f(x). This means that, in this case, both  d(x) d(x) and  q(x) q(x) are factors of  f(x). f(x).

###  How To

**Given a polynomial and a binomial, use long division to divide the polynomial by the binomial.**

  1. Set up the division problem.
  2. Determine the first term of the quotient by dividing the leading term of the dividend by the leading term of the divisor.
  3. Multiply the answer by the divisor and write it below the like terms of the dividend.
  4. Subtract the bottom binomial from the top binomial.
  5. Bring down the next term of the dividend.
  6. Repeat steps 2–5 until reaching the last term of the dividend.
  7. If the remainder is non-zero, express as a fraction using the divisor as the denominator.

###  Example  1

#### Using Long Division to Divide a Second-Degree Polynomial

Divide  5 x 2 +3x−2 5 x 2 +3x−2 by  x+1. x+1.

####  Solution

![Steps of long division for polynomials.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/4bb541c24739a5393546f9b9b66831c8b9626fc2)

The quotient is  5x−2. 5x−2. The remainder is 0. We write the result as

5 x 2 +3x−2 x+1 =5x−2 5 x 2 +3x−2 x+1 =5x−2

or

5 x 2 +3x−2=( x+1 )( 5x−2 ) 5 x 2 +3x−2=( x+1 )( 5x−2 )

#### Analysis 

This division problem had a remainder of 0. This tells us that the dividend is divided evenly by the divisor, and that the divisor is a factor of the dividend.

###  Example  2

#### Using Long Division to Divide a Third-Degree Polynomial

Divide  6 x 3 +11 x 2 −31x+15 6 x 3 +11 x 2 −31x+15 by  3x−2. 3x−2.

####  Solution

![Steps of long division for polynomials.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/5c1d58c86d624bbd19a2d68e7c4725b1ef41655f)

There is a remainder of 1. We can express the result as:

6 x 3 +11 x 2 −31x+15 3x−2 =2 x 2 +5x−7+ 1 3x−2 6 x 3 +11 x 2 −31x+15 3x−2 =2 x 2 +5x−7+ 1 3x−2

#### Analysis 

We can check our work by using the Division Algorithm to rewrite the solution. Then multiply.

(3x−2)(2 x 2 +5x−7)+1=6 x 3 +11 x 2 −31x+15 (3x−2)(2 x 2 +5x−7)+1=6 x 3 +11 x 2 −31x+15

Notice, as we write our result,

  * the dividend is  6 x 3 +11 x 2 −31x+15 6 x 3 +11 x 2 −31x+15
  * the divisor is  3x−2 3x−2
  * the quotient is  2 x 2 +5x−7 2 x 2 +5x−7
  * the remainder is  1 1

###  Try It  #1

Divide  16 x 3 −12 x 2 +20x−3 16 x 3 −12 x 2 +20x−3 by  4x+5. 4x+5.

### Using Synthetic Division to Divide Polynomials

As we’ve seen, long division of polynomials can involve many steps and be quite cumbersome. **Synthetic division** is a shorthand method of dividing polynomials for the special case of dividing by a linear factor whose leading coefficient is 1.

To illustrate the process, recall the example at the beginning of the section.

Divide  2 x 3 −3 x 2 +4x+5 2 x 3 −3 x 2 +4x+5 by  x+2 x+2 using the long division algorithm.

The final form of the process looked like this:

![.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/3b234ea3bc0eac29d1cf9ca1ff2f70fba76ca79b)

There is a lot of repetition in the table. If we don’t write the variables but, instead, line up their coefficients in columns under the division sign and also eliminate the partial products, we already have a simpler version of the entire problem.

![Synthetic division of the polynomial 2x^3-3x^2+4x+5 by x+2 in which it only contains the coefficients of each polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/6e0d0074905bf0272d1d4cbe2690e6009aa46409)

Synthetic division carries this simplification even a few more steps. Collapse the table by moving each of the rows up to fill any vacant spots. Also, instead of dividing by 2, as we would in division of whole numbers, then multiplying and subtracting the middle product, we change the sign of the “divisor” to –2, multiply and add. The process starts by bringing down the leading coefficient.

![Synthetic division of the polynomial 2x^3-3x^2+4x+5 by x+2 in which it only contains the coefficients of each polynomial.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/e37af41cac58008922e2bf6b604119e15e778d23)

We then multiply it by the “divisor” and add, repeating this process column by column, until there are no entries left. The bottom row represents the coefficients of the quotient; the last entry of the bottom row is the remainder. In this case, the quotient is  2x²–7x+18 2x²–7x+18 and the remainder is  –31. –31. The process will be made more clear in [Example 3](<3-5-dividing-polynomials#Example_03_05_03>).

###  Synthetic Division

Synthetic division is a shortcut that can be used when the divisor is a binomial in the form  x−k. x−k. In synthetic division, only the coefficients are used in the division process.

###  How To

**Given two polynomials, use synthetic division to divide.**

  1. Write  k k for the divisor.
  2. Write the coefficients of the dividend.
  3. Bring the lead coefficient down.
  4. Multiply the lead coefficient by  k. k. Write the product in the next column.
  5. Add the terms of the second column.
  6. Multiply the result by  k. k. Write the product in the next column.
  7. Repeat steps 5 and 6 for the remaining columns.
  8. Use the bottom numbers to write the quotient. The number in the last column is the remainder and has degree 0, the next number from the right has degree 0, the next number from the right has degree 1, and so on.

###  Example  3

#### Using Synthetic Division to Divide a Second-Degree Polynomial

Use synthetic division to divide  5 x 2 −3x−36 5 x 2 −3x−36 by  x−3. x−3.

####  Solution

Begin by setting up the synthetic division. Write  k k and the coefficients.

![A collapsed version of the previous synthetic division.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/9f9b7c3f2afaf1c98578471f8ec6fd5c3b34749f)

Bring down the lead coefficient. Multiply the lead coefficient by  k. k.

![The set-up of the synthetic division for the polynomial 5x^2-3x-36 by x-3, which renders {5, -3, -36} by 3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8b638e9a3fafd6b1e6496583a605b4a0b4858d0e)

Continue by adding the numbers in the second column. Multiply the resulting number by  k. k. Write the result in the next column. Then add the numbers in the third column.

![Multiplied by the lead coefficient, 5, in the second column, and the lead coefficient is brought down to the second row. ](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a77e7bc9a6d09d92cfe1e1f485fc8887a5ba4e6f)

The result is  5x+12. 5x+12. The remainder is 0. So  x−3 x−3 is a factor of the original polynomial.

#### Analysis 

Just as with long division, we can check our work by multiplying the quotient by the divisor and adding the remainder.

(x−3)(5x+12)+0=5 x 2 −3x−36 (x−3)(5x+12)+0=5 x 2 −3x−36

###  Example  4

#### Using Synthetic Division to Divide a Third-Degree Polynomial

Use synthetic division to divide  4 x 3 +10 x 2 −6x−20 4 x 3 +10 x 2 −6x−20 by  x+2. x+2.

####  Solution

The binomial divisor is  x+2 x+2 so  k=−2. k=−2. Add each column, multiply the result by –2, and repeat until the last column is reached.

![Synthetic division of 4x^3+10x^2-6x-20 divided by x+2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/94c7db45d83d1f51157c2e6b921b608c8e15f02f)

The result is  4 x 2 +2x−10. 4 x 2 +2x−10. The remainder is 0. Thus,  x+2 x+2 is a factor of  4 x 3 +10 x 2 −6x−20. 4 x 3 +10 x 2 −6x−20.

#### Analysis 

The graph of the polynomial function  f(x)=4 x 3 +10 x 2 −6x−20 f(x)=4 x 3 +10 x 2 −6x−20 in [Figure 2](<3-5-dividing-polynomials#Figure_03_05_009>) shows a zero at  x=k=−2. x=k=−2. This confirms that  x+2 x+2 is a factor of  4 x 3 +10 x 2 −6x−20. 4 x 3 +10 x 2 −6x−20.

![Synthetic division of 4x^3+10x^2-6x-20 divided by x+2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a36cade40224f0f08814c301d0a8ca455617eec2) Figure  2

###  Example  5

#### Using Synthetic Division to Divide a Fourth-Degree Polynomial

Use synthetic division to divide  −9 x 4 +10 x 3 +7 x 2 −6 −9 x 4 +10 x 3 +7 x 2 −6 by  x−1. x−1.

####  Solution

Notice there is no _x_ -term. We will use a zero as the coefficient for that term.  
  

![.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/ebdea04f669c00e713642285f11b8551344c156e)

The result is  −9 x 3 + x 2 +8x+8+ 2 x−1 . −9 x 3 + x 2 +8x+8+ 2 x−1 .

###  Try It  #2

Use synthetic division to divide  3 x 4 +18 x 3 −3x+40 3 x 4 +18 x 3 −3x+40 by  x+7. x+7.

### Using Polynomial Division to Solve Application Problems

Polynomial division can be used to solve a variety of application problems involving expressions for area and volume. We looked at an application at the beginning of this section. Now we will solve that problem in the following example.

###  Example  6

#### Using Polynomial Division in an Application Problem

The volume of a rectangular solid is given by the polynomial  3 x 4 −3 x 3 −33 x 2 +54x. 3 x 4 −3 x 3 −33 x 2 +54x. The length of the solid is given by  3x 3x and the width is given by  x−2. x−2. Find the height of the solid.

####  Solution

There are a few ways to approach this problem. We need to divide the expression for the volume of the solid by the expressions for the length and width. Let us create a sketch as in [Figure 3](<3-5-dividing-polynomials#Figure_03_05_010>).

![Graph of f\(x\)=4x^3+10x^2-6x-20 with a close up on x+2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/fc1a8c7d3dd929f331a9e0b414d36568e7f722dd) Figure  3

We can now write an equation by substituting the known values into the formula for the volume of a rectangular solid.

V=l⋅w⋅h 3 x 4 −3 x 3 −33 x 2 +54x=3x⋅(x−2)⋅h V=l⋅w⋅h 3 x 4 −3 x 3 −33 x 2 +54x=3x⋅(x−2)⋅h

To solve for  h, h, first divide both sides by  3x. 3x.

3x⋅(x−2)⋅h 3x = 3 x 4 −3 x 3 −33 x 2 +54x 3x (x−2)h= x 3 − x 2 −11x+18 3x⋅(x−2)⋅h 3x = 3 x 4 −3 x 3 −33 x 2 +54x 3x (x−2)h= x 3 − x 2 −11x+18

Now solve for  h h using synthetic division.

h= x 3 − x 2 −11x+18 x−2 h= x 3 − x 2 −11x+18 x−2

2 1 −1 −11 18 2 2 −18 1 1 −9 0 2 1 −1 −11 18 2 2 −18 1 1 −9 0

The quotient is  x 2 +x−9 x 2 +x−9 and the remainder is 0. The height of the solid is  x 2 +x−9. x 2 +x−9.

###  Try It  #3

The area of a rectangle is given by  3 x 3 +14 x 2 −23x+6. 3 x 3 +14 x 2 −23x+6. The width of the rectangle is given by  x+6. x+6. Find an expression for the length of the rectangle.

###  Media

Access these online resources for additional instruction and practice with polynomial division.

  * [Dividing a Trinomial by a Binomial Using Long Division](<http://openstax.org/l/dividetribild>)
  * [Dividing a Polynomial by a Binomial Using Long Division ](<http://openstax.org/l/dividepolybild>)
  * [Ex 2: Dividing a Polynomial by a Binomial Using Synthetic Division](<http://openstax.org/l/dividepolybisd2>)
  * [Ex 4: Dividing a Polynomial by a Binomial Using Synthetic Division](<http://openstax.org/l/dividepolybisd4>)

###  3.5 Section Exercises

#### Verbal

[1](<chapter-3>). 

If division of a polynomial by a binomial results in a remainder of zero, what can be conclude?

2. 

If a polynomial of degree  n n is divided by a binomial of degree 1, what is the degree of the quotient?

#### Algebraic 

For the following exercises, use long division to divide. Specify the quotient and the remainder.

[3](<chapter-3>). 

( x 2 +5x−1 )÷( x−1 ) ( x 2 +5x−1 )÷( x−1 )

4. 

( 2 x 2 −9x−5 )÷( x−5 ) ( 2 x 2 −9x−5 )÷( x−5 )

[5](<chapter-3>). 

( 3 x 2 +23x+14 )÷( x+7 ) ( 3 x 2 +23x+14 )÷( x+7 )

6. 

( 4 x 2 −10x+6 )÷( 4x+2 ) ( 4 x 2 −10x+6 )÷( 4x+2 )

[7](<chapter-3>). 

( 6 x 2 −25x−25 )÷( 6x+5 ) ( 6 x 2 −25x−25 )÷( 6x+5 )

8. 

( − x 2 −1 )÷( x+1 ) ( − x 2 −1 )÷( x+1 )

[9](<chapter-3>). 

( 2 x 2 −3x+2 )÷( x+2 ) ( 2 x 2 −3x+2 )÷( x+2 )

10. 

( x 3 −126 )÷( x−5 ) ( x 3 −126 )÷( x−5 )

[11](<chapter-3>). 

( 3 x 2 −5x+4 )÷( 3x+1 ) ( 3 x 2 −5x+4 )÷( 3x+1 )

12. 

( x 3 −3 x 2 +5x−6 )÷( x−2 ) ( x 3 −3 x 2 +5x−6 )÷( x−2 )

[13](<chapter-3>). 

( 2 x 3 +3 x 2 −4x+15 )÷( x+3 ) ( 2 x 3 +3 x 2 −4x+15 )÷( x+3 )

For the following exercises, use synthetic division to find the quotient.

14. 

( 3 x 3 −2 x 2 +x−4 )÷( x+3 ) ( 3 x 3 −2 x 2 +x−4 )÷( x+3 )

[15](<chapter-3>). 

( 2 x 3 −6 x 2 −7x+6 )÷(x−4) ( 2 x 3 −6 x 2 −7x+6 )÷(x−4)

16. 

( 6 x 3 −10 x 2 −7x−15 )÷(x+1) ( 6 x 3 −10 x 2 −7x−15 )÷(x+1)

[17](<chapter-3>). 

( 4 x 3 −12 x 2 −5x−1 )÷(2x+1) ( 4 x 3 −12 x 2 −5x−1 )÷(2x+1)

18. 

( 9 x 3 −9 x 2 +18x+5 )÷(3x−1) ( 9 x 3 −9 x 2 +18x+5 )÷(3x−1)

[19](<chapter-3>). 

( 3 x 3 −2 x 2 +x−4 )÷( x+3 ) ( 3 x 3 −2 x 2 +x−4 )÷( x+3 )

20. 

( −6 x 3 + x 2 −4 )÷( 2x−3 ) ( −6 x 3 + x 2 −4 )÷( 2x−3 )

[21](<chapter-3>). 

( 2 x 3 +7 x 2 −13x−3 )÷( 2x−3 ) ( 2 x 3 +7 x 2 −13x−3 )÷( 2x−3 )

22. 

( 3 x 3 −5 x 2 +2x+3 )÷(x+2) ( 3 x 3 −5 x 2 +2x+3 )÷(x+2)

[23](<chapter-3>). 

( 4 x 3 −5 x 2 +13 )÷(x+4) ( 4 x 3 −5 x 2 +13 )÷(x+4)

24. 

( x 3 −3x+2 )÷( x+2 ) ( x 3 −3x+2 )÷( x+2 )

[25](<chapter-3>). 

( x 3 −21 x 2 +147x−343 )÷( x−7 ) ( x 3 −21 x 2 +147x−343 )÷( x−7 )

26. 

( x 3 −15 x 2 +75x−125 )÷( x−5 ) ( x 3 −15 x 2 +75x−125 )÷( x−5 )

[27](<chapter-3>). 

( 9 x 3 −x+2 )÷( 3x−1 ) ( 9 x 3 −x+2 )÷( 3x−1 )

28. 

( 6 x 3 − x 2 +5x+2 )÷( 3x+1 ) ( 6 x 3 − x 2 +5x+2 )÷( 3x+1 )

[29](<chapter-3>). 

( x 4 + x 3 −3 x 2 −2x+1 )÷( x+1 ) ( x 4 + x 3 −3 x 2 −2x+1 )÷( x+1 )

30. 

( x 4 −3 x 2 +1 )÷( x−1 ) ( x 4 −3 x 2 +1 )÷( x−1 )

[31](<chapter-3>). 

( x 4 +2 x 3 −3 x 2 +2x+6 )÷( x+3 ) ( x 4 +2 x 3 −3 x 2 +2x+6 )÷( x+3 )

32. 

( x 4 −10 x 3 +37 x 2 −60x+36 )÷( x−2 ) ( x 4 −10 x 3 +37 x 2 −60x+36 )÷( x−2 )

[33](<chapter-3>). 

( x 4 −8 x 3 +24 x 2 −32x+16 )÷( x−2 ) ( x 4 −8 x 3 +24 x 2 −32x+16 )÷( x−2 )

34. 

( x 4 +5 x 3 −3 x 2 −13x+10 )÷( x+5 ) ( x 4 +5 x 3 −3 x 2 −13x+10 )÷( x+5 )

[35](<chapter-3>). 

( x 4 −12 x 3 +54 x 2 −108x+81 )÷( x−3 ) ( x 4 −12 x 3 +54 x 2 −108x+81 )÷( x−3 )

36. 

( 4 x 4 −2 x 3 −4x+2 )÷( 2x−1 ) ( 4 x 4 −2 x 3 −4x+2 )÷( 2x−1 )

[37](<chapter-3>). 

( 4 x 4 +2 x 3 −4 x 2 +2x+2 )÷( 2x+1 ) ( 4 x 4 +2 x 3 −4 x 2 +2x+2 )÷( 2x+1 )

For the following exercises, use synthetic division to determine whether the first expression is a factor of the second. If it is, indicate the factorization.

38. 

x−2,4 x 3 −3 x 2 −8x+4 x−2,4 x 3 −3 x 2 −8x+4

[39](<chapter-3>). 

x−2,3 x 4 −6 x 3 −5x+10 x−2,3 x 4 −6 x 3 −5x+10

40. 

x+3,−4 x 3 +5 x 2 +8 x+3,−4 x 3 +5 x 2 +8

[41](<chapter-3>). 

x−2,4 x 4 −15 x 2 −4 x−2,4 x 4 −15 x 2 −4

42. 

x− 1 2 ,2 x 4 − x 3 +2x−1 x− 1 2 ,2 x 4 − x 3 +2x−1

[43](<chapter-3>). 

x+ 1 3 ,3 x 4 + x 3 −3x+1 x+ 1 3 ,3 x 4 + x 3 −3x+1

#### Graphical

For the following exercises, use the graph of the third-degree polynomial and one factor to write the factored form of the polynomial suggested by the graph. The leading coefficient is one.

44. 

Factor is  x 2 −x+3 x 2 −x+3

![Graph of a polynomial that has a x-intercept at -1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/c6d107e4540de20a05d0ec88e4a90387178d41b2)

[45](<chapter-3>). 

Factor is  x 2 +2x+4 x 2 +2x+4

![Graph of a polynomial that has a x-intercept at 1.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/7fb421522dcd4d4d0f220fdd9ceb28d54774ffcc)

46. 

Factor is  x 2 +2x+5 x 2 +2x+5

![Graph of a polynomial that has a x-intercept at 2.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/a592de91e6672cd41eef495d53d6002f85a9c36a)

[47](<chapter-3>). 

Factor is  x 2 +x+1 x 2 +x+1

![Graph of a polynomial that has a x-intercept at 5.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/0de0bff90e32c4df60909455bf7cbd34294d97fa)

48. 

Factor is  x 2 +2x+2 x 2 +2x+2

![Graph of a polynomial that has a x-intercept at -3.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/114159afe3f01422c1d30a88d66aa9b4d7844a93)

For the following exercises, use synthetic division to find the quotient and remainder.

[49](<chapter-3>). 

4 x 3 −33 x−2 4 x 3 −33 x−2

50. 

2 x 3 +25 x+3 2 x 3 +25 x+3

[51](<chapter-3>). 

3 x 3 +2x−5 x−1 3 x 3 +2x−5 x−1

52. 

−4 x 3 − x 2 −12 x+4 −4 x 3 − x 2 −12 x+4

[53](<chapter-3>). 

x 4 −22 x+2 x 4 −22 x+2

#### Technology

For the following exercises, use a calculator with CAS to answer the questions.

54. 

Consider  x k −1 x−1 x k −1 x−1 with  k=1 k=1,22,3. 3. What do you expect the result to be if  k=4? k=4?

[55](<chapter-3>). 

Consider  x k +1 x+1 x k +1 x+1 for  k=1 k=1,33,5. 5. What do you expect the result to be if  k=7? k=7?

56. 

Consider  x 4 − k 4 x−k x 4 − k 4 x−k for  k=1 k=1,22,3. 3. What do you expect the result to be if  k=4? k=4?

[57](<chapter-3>). 

Consider  x k x+1 x k x+1 with  k=1 k=1,22,3. 3. What do you expect the result to be if  k=4? k=4?

58. 

Consider  x k x−1 x k x−1 with  k=1 k=1,22,3. 3. What do you expect the result to be if  k=4? k=4?

#### Extensions

For the following exercises, use synthetic division to determine the quotient involving a complex number.

[59](<chapter-3>). 

x+1 x−i x+1 x−i

60. 

x 2 +1 x−i x 2 +1 x−i

[61](<chapter-3>). 

x+1 x+i x+1 x+i

62. 

x 2 +1 x+i x 2 +1 x+i

[63](<chapter-3>). 

x 3 +1 x−i x 3 +1 x−i

#### Real-World Applications

For the following exercises, use the given length and area of a rectangle to express the width algebraically.

64. 

Length is  x+5, x+5, area is  2 x 2 +9x−5. 2 x 2 +9x−5.

[65](<chapter-3>). 

Length is  2x+5, 2x+5, area is  4 x 3 +10 x 2 +6x+15 4 x 3 +10 x 2 +6x+15

66. 

Length is  3x–4, 3x–4, area is  6 x 4 −8 x 3 +9 x 2 −9x−4 6 x 4 −8 x 3 +9 x 2 −9x−4

For the following exercises, use the given volume of a box and its length and width to express the height of the box algebraically.

[67](<chapter-3>). 

Volume is  12 x 3 +20 x 2 −21x−36, 12 x 3 +20 x 2 −21x−36, length is  2x+3, 2x+3, width is  3x−4. 3x−4.

68. 

Volume is  18 x 3 −21 x 2 −40x+48, 18 x 3 −21 x 2 −40x+48, length is  3x–4, 3x–4, width is  3x–4. 3x–4.

[69](<chapter-3>). 

Volume is  10 x 3 +27 x 2 +2x−24, 10 x 3 +27 x 2 +2x−24, length is  5x–4, 5x–4, width is  2x+3. 2x+3.

70. 

Volume is  10 x 3 +30 x 2 −8x−24, 10 x 3 +30 x 2 −8x−24, length is  2, 2, width is  x+3. x+3.

For the following exercises, use the given volume and radius of a cylinder to express the height of the cylinder algebraically.

[71](<chapter-3>). 

Volume is  π(25 x 3 −65 x 2 −29x−3), π(25 x 3 −65 x 2 −29x−3), radius is  5x+1. 5x+1.

72. 

Volume is  π(4 x 3 +12 x 2 −15x−50), π(4 x 3 +12 x 2 −15x−50), radius is  2x+5. 2x+5.

[73](<chapter-3>). 

Volume is  π(3 x 4 +24 x 3 +46 x 2 −16x−32), π(3 x 4 +24 x 3 +46 x 2 −16x−32), radius is  x+4. x+4.

### Footnotes

  * 1National Park Service. "Lincoln Memorial Building Statistics." <http://www.nps.gov/linc/historyculture/lincoln-memorial-building-statistics.htm>. Accessed 4/3/2014

