# 1.5 Factoring Polynomials

> Source: College Algebra. OpenStax / Rice University.
> Official URL: https://openstax.org/books/college-algebra/pages/1-5-factoring-polynomials
> License: CC BY 4.0
> Reused without endorsement. Original copyright notices retained.

## 1.5 Factoring Polynomials

### Learning Objectives

In this section, you will:

  * Factor the greatest common factor of a polynomial.
  * Factor a trinomial.
  * Factor by grouping.
  * Factor a perfect square trinomial.
  * Factor a difference of squares.
  * Factor the sum and difference of cubes.
  * Factor expressions using fractional or negative exponents.

Imagine that we are trying to find the area of a lawn so that we can determine how much grass seed to purchase. The lawn is the green portion in [Figure 1](<1-5-factoring-polynomials#Figure_01_05_001>).

![A large rectangle with smaller squares and a rectangle inside. The length of the outer rectangle is 6x and the width is 10x. The side length of the squares is 4 and the height of the width of the inner rectangle is 4.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/1d8334364de09dc6023724a6aded5ab744b644ed) Figure  1

The area of the entire region can be found using the formula for the area of a rectangle.

A = lw = 10x⋅6x = 60 x 2 units 2 A = lw = 10x⋅6x = 60 x 2 units 2

The areas of the portions that do not require grass seed need to be subtracted from the area of the entire region. The two square regions each have an area of  A= s 2 = 4 2 =16 A= s 2 = 4 2 =16 units2. The other rectangular region has one side of length  10x−8 10x−8 and one side of length  4, 4, giving an area of  A=lw=4(10x−8)=40x−32 A=lw=4(10x−8)=40x−32 units2. So the region that must be subtracted has an area of  2(16)+40x−32=40x 2(16)+40x−32=40x units2.

The area of the region that requires grass seed is found by subtracting  60 x 2 −40x 60 x 2 −40x units2. This area can also be expressed in factored form as  20x(3x−2) 20x(3x−2) units2. We can confirm that this is an equivalent expression by multiplying.

Many polynomial expressions can be written in simpler forms by factoring. In this section, we will look at a variety of methods that can be used to factor polynomial expressions.

### Factoring the Greatest Common Factor of a Polynomial

When we study fractions, we learn that the greatest common factor (GCF) of two numbers is the largest number that divides evenly into both numbers. For instance,  4 4 is the GCF of  16 16 and  20 20 because it is the largest number that divides evenly into both  16 16 and  20 20 The GCF of polynomials works the same way:  4x 4x is the GCF of  16x 16x and  20 x 2 20 x 2 because it is the largest polynomial that divides evenly into both  16x 16x and  20 x 2 . 20 x 2 .

When factoring a polynomial expression, our first step should be to check for a GCF. Look for the GCF of the coefficients, and then look for the GCF of the variables.

###  Greatest Common Factor

The greatest common factor (GCF) of polynomials is the largest polynomial that divides evenly into the polynomials.

###  How To

**Given a polynomial expression, factor out the greatest common factor.**

  1. Identify the GCF of the coefficients.
  2. Identify the GCF of the variables.
  3. Combine to find the GCF of the expression.
  4. Determine what the GCF needs to be multiplied by to obtain each term in the expression.
  5. Write the factored expression as the product of the GCF and the sum of the terms we need to multiply by.

###  Example  1

#### Factoring the Greatest Common Factor

Factor  6 x 3 y 3 +45 x 2 y 2 +21xy. 6 x 3 y 3 +45 x 2 y 2 +21xy.

####  Solution

First, find the GCF of the expression. The GCF of 6, 45, and 21 is 3. The GCF of  x 3 , x 2 x 3 , x 2 , and  x x is  x x . (Note that the GCF of a set of expressions in the form  x n x n will always be the exponent of lowest degree.) And the GCF of  y 3 , y 2 y 3 , y 2 , and  y y is  y y . Combine these to find the GCF of the polynomial,  3xy 3xy . 

Next, determine what the GCF needs to be multiplied by to obtain each term of the polynomial. We find that  3xy(2 x 2 y 2 )=6 x 3 y 3 ,3xy(15xy)=45 x 2 y 2 3xy(2 x 2 y 2 )=6 x 3 y 3 ,3xy(15xy)=45 x 2 y 2 , and  3xy(7)=21xy. 3xy(7)=21xy.

Finally, write the factored expression as the product of the GCF and the sum of the terms we needed to multiply by.

(3xy)(2 x 2 y 2 +15xy+7) (3xy)(2 x 2 y 2 +15xy+7)

#### Analysis 

After factoring, we can check our work by multiplying. Use the distributive property to confirm that  (3xy)(2 x 2 y 2 +15xy+7)=6 x 3 y 3 +45 x 2 y 2 +21xy. (3xy)(2 x 2 y 2 +15xy+7)=6 x 3 y 3 +45 x 2 y 2 +21xy.

###  Try It  #1

Factor  x( b 2 −a)+6( b 2 −a) x( b 2 −a)+6( b 2 −a) by pulling out the GCF.

### Factoring a Trinomial with Leading Coefficient 1

Although we should always begin by looking for a GCF, pulling out the GCF is not the only way that polynomial expressions can be factored. The polynomial  x 2 +5x+6 x 2 +5x+6 has a GCF of 1, but it can be written as the product of the factors  (x+2) (x+2) and  (x+3). (x+3).

Trinomials of the form  x 2 +bx+c x 2 +bx+c can be factored by finding two numbers with a product of  c c and a sum of  b. b. The trinomial  x 2 +10x+16, x 2 +10x+16, for example, can be factored using the numbers  2 2 and  8 8 because the product of those numbers is  16 16 and their sum is  10. 10. The trinomial can be rewritten as the product of  (x+2) (x+2) and  (x+8). (x+8).

###  Factoring a Trinomial with Leading Coefficient 1

A trinomial of the form  x 2 +bx+c x 2 +bx+c can be written in factored form as  (x+p)(x+q) (x+p)(x+q) where  pq=c pq=c and  p+q=b. p+q=b.

###  Q&A

**Can every trinomial be factored as a product of binomials?**

_No. Some polynomials cannot be factored. These polynomials are said to be prime._

###  How To

**Given a trinomial in the form x 2 +bx+c, x 2 +bx+c, factor it.**

  1. List factors of  c. c.
  2. Find  p p and  q, q, a pair of factors of  c c with a sum of  b. b.
  3. Write the factored expression  (x+p)(x+q). (x+p)(x+q).

###  Example  2

#### Factoring a Trinomial with Leading Coefficient 1

Factor  x 2 +2x−15. x 2 +2x−15.

####  Solution

We have a trinomial with leading coefficient  1,b=2, 1,b=2, and  c=−15. c=−15. We need to find two numbers with a product of  −15 −15 and a sum of  2. 2. In the table below, we list factors until we find a pair with the desired sum.

Factors of  −15 −15 | Sum of Factors  
---|---  
1,−15 1,−15 |  −14 −14  
−1,15 −1,15 | 14  
3,−5 3,−5 |  −2 −2  
−3,5 −3,5 | 2  
  
Now that we have identified  p p and  q q as  −3 −3 and  5, 5, write the factored form as  (x−3)(x+5). (x−3)(x+5).

#### Analysis 

We can check our work by multiplying. Use FOIL to confirm that  (x−3)(x+5)= x 2 +2x−15. (x−3)(x+5)= x 2 +2x−15.

###  Q&A

**Does the order of the factors matter?**

_No. Multiplication is commutative, so the order of the factors does not matter._

###  Try It  #2

Factor  x 2 −7x+6. x 2 −7x+6.

### Factoring by Grouping

Trinomials with leading coefficients other than 1 are slightly more complicated to factor. For these trinomials, we can factor by grouping by dividing the _x_ term into the sum of two terms, factoring each portion of the expression separately, and then factoring out the GCF of the entire expression. The trinomial  2 x 2 +5x+3 2 x 2 +5x+3 can be rewritten as  (2x+3)(x+1) (2x+3)(x+1) using this process. We begin by rewriting the original expression as  2 x 2 +2x+3x+3 2 x 2 +2x+3x+3 and then factor each portion of the expression to obtain  2x(x+1)+3(x+1). 2x(x+1)+3(x+1). We then pull out the GCF of  (x+1) (x+1) to find the factored expression.

###  Factor by Grouping

To factor a trinomial in the form  a x 2 +bx+c a x 2 +bx+c by grouping, we find two numbers with a product of  ac ac and a sum of  b. b. We use these numbers to divide the  x x term into the sum of two terms and factor each portion of the expression separately, then factor out the GCF of the entire expression.

###  How To

**Given a trinomial in the form a x 2 +bx+c, a x 2 +bx+c, factor by grouping.**

  1. List factors of  ac. ac.
  2. Find  p p and  q, q, a pair of factors of  ac ac with a sum of  b. b.
  3. Rewrite the original expression as  a x 2 +px+qx+c. a x 2 +px+qx+c.
  4. Pull out the GCF of  a x 2 +px. a x 2 +px.
  5. Pull out the GCF of  qx+c. qx+c.
  6. Factor out the GCF of the expression.

###  Example  3

#### Factoring a Trinomial by Grouping

Factor  5 x 2 +7x−6 5 x 2 +7x−6 by grouping.

####  Solution

We have a trinomial with  a=5,b=7, a=5,b=7, and  c=−6. c=−6. First, determine  ac=−30. ac=−30. We need to find two numbers with a product of  −30 −30 and a sum of  7. 7. In the table below, we list factors until we find a pair with the desired sum.

Factors of  −30 −30 | Sum of Factors  
---|---  
1,−30 1,−30 |  −29 −29  
−1,30 −1,30 | 29  
2,−15 2,−15 |  −13 −13  
−2,15 −2,15 | 13  
3,−10 3,−10 |  −7 −7  
−3,10 −3,10 | 7  
  
So  p=−3 p=−3 and  q=10. q=10.

5 x 2 −3x+10x−6 Rewrite the original expression as a x 2 +px+qx+c. x(5x−3)+2(5x−3) Factor out the GCF of each part. (5x−3)(x+2) Factor out the GCF​of the expression. 5 x 2 −3x+10x−6 Rewrite the original expression as a x 2 +px+qx+c. x(5x−3)+2(5x−3) Factor out the GCF of each part. (5x−3)(x+2) Factor out the GCF​of the expression.

#### Analysis 

We can check our work by multiplying. Use FOIL to confirm that  (5x−3)(x+2)=5 x 2 +7x−6. (5x−3)(x+2)=5 x 2 +7x−6.

###  Try It  #3

Factor 

  1. ⓐ 2 x 2 +9x+9 2 x 2 +9x+9
  2. ⓑ 6 x 2 +x−1 6 x 2 +x−1

###  Factoring a Perfect Square Trinomial

A perfect square trinomial is a trinomial that can be written as the square of a binomial. Recall that when a binomial is squared, the result is the square of the first term added to twice the product of the two terms and the square of the last term.

a 2 +2ab+ b 2 = (a+b) 2 and a 2 −2ab+ b 2 = (a−b) 2 a 2 +2ab+ b 2 = (a+b) 2 and a 2 −2ab+ b 2 = (a−b) 2

We can use this equation to factor any perfect square trinomial.

###  Perfect Square Trinomials

A perfect square trinomial can be written as the square of a binomial:

a 2 +2ab+ b 2 = (a+b) 2 a 2 +2ab+ b 2 = (a+b) 2

###  How To

**Given a perfect square trinomial, factor it into the square of a binomial.**

  1. Confirm that the first and last term are perfect squares.
  2. Confirm that the middle term is twice the product of  ab. ab.
  3. Write the factored form as  (a+b) 2 . (a+b) 2 .

###  Example  4

#### Factoring a Perfect Square Trinomial

Factor  25 x 2 +20x+4. 25 x 2 +20x+4.

####  Solution

Notice that  25 x 2 25 x 2 and  4 4 are perfect squares because  25 x 2 = (5x) 2 25 x 2 = (5x) 2 and  4= 2 2 . 4= 2 2 . Then check to see if the middle term is twice the product of  5x 5x and  2. 2. The middle term is, indeed, twice the product:  2(5x)(2)=20x. 2(5x)(2)=20x. Therefore, the trinomial is a perfect square trinomial and can be written as  (5x+2) 2 . (5x+2) 2 .

###  Try It  #4

Factor  49 x 2 −14x+1. 49 x 2 −14x+1.

### Factoring a Difference of Squares

A difference of squares is a perfect square subtracted from a perfect square. Recall that a difference of squares can be rewritten as factors containing the same terms but opposite signs because the middle terms cancel each other out when the two factors are multiplied.

a 2 − b 2 =(a+b)(a−b) a 2 − b 2 =(a+b)(a−b)

We can use this equation to factor any differences of squares.

###  Differences of Squares

A difference of squares can be rewritten as two factors containing the same terms but opposite signs.

a 2 − b 2 =(a+b)(a−b) a 2 − b 2 =(a+b)(a−b)

###  How To

**Given a difference of squares, factor it into binomials.**

  1. Confirm that the first and last term are perfect squares.
  2. Write the factored form as  (a+b)(a−b). (a+b)(a−b).

###  Example  5

#### Factoring a Difference of Squares

Factor  9 x 2 −25. 9 x 2 −25.

####  Solution

Notice that  9 x 2 9 x 2 and  25 25 are perfect squares because  9 x 2 = (3x) 2 9 x 2 = (3x) 2 and  25= 5 2 . 25= 5 2 . The polynomial represents a difference of squares and can be rewritten as  (3x+5)(3x−5). (3x+5)(3x−5).

###  Try It  #5

Factor  81 y 2 −100. 81 y 2 −100.

###  Q&A

**Is there a formula to factor the sum of squares?**

_No. A sum of squares cannot be factored._

### Factoring the Sum and Difference of Cubes

Now, we will look at two new special products: the sum and difference of cubes. Although the sum of squares cannot be factored, the sum of cubes can be factored into a binomial and a trinomial.

a 3 + b 3 =(a+b)( a 2 −ab+ b 2 ) a 3 + b 3 =(a+b)( a 2 −ab+ b 2 )

Similarly, the sum of cubes can be factored into a binomial and a trinomial, but with different signs.

a 3 − b 3 =(a−b)( a 2 +ab+ b 2 ) a 3 − b 3 =(a−b)( a 2 +ab+ b 2 )

We can use the acronym SOAP to remember the signs when factoring the sum or difference of cubes. The first letter of each word relates to the signs: **S** ame **O** pposite **A** lways **P** ositive. For example, consider the following example.

x 3 − 2 3 =(x−2)( x 2 +2x+4 ) x 3 − 2 3 =(x−2)( x 2 +2x+4 )

The sign of the first 2 is the _same_ as the sign between  x 3 − 2 3 . x 3 − 2 3 . The sign of the  2x 2x term is _opposite_ the sign between  x 3 − 2 3 . x 3 − 2 3 . And the sign of the last term, 4, is _always positive_.

###  Sum and Difference of Cubes

We can factor the sum of two cubes as

a 3 + b 3 =(a+b)( a 2 −ab+ b 2 ) a 3 + b 3 =(a+b)( a 2 −ab+ b 2 )

We can factor the difference of two cubes as

a 3 − b 3 =(a−b)( a 2 +ab+ b 2 ) a 3 − b 3 =(a−b)( a 2 +ab+ b 2 )

###  How To

**Given a sum of cubes or difference of cubes, factor it.**

  1. Confirm that the first and last term are cubes,  a 3 + b 3 a 3 + b 3 or  a 3 − b 3 . a 3 − b 3 .
  2. For a sum of cubes, write the factored form as  (a+b)( a 2 −ab+ b 2 ). (a+b)( a 2 −ab+ b 2 ). For a difference of cubes, write the factored form as  (a−b)( a 2 +ab+ b 2 ). (a−b)( a 2 +ab+ b 2 ).

###  Example  6

#### Factoring a Sum of Cubes

Factor  x 3 +512. x 3 +512.

####  Solution

Notice that  x 3 x 3 and  512 512 are cubes because  8 3 =512. 8 3 =512. Rewrite the sum of cubes as  (x+8)( x 2 −8x+64). (x+8)( x 2 −8x+64).

#### Analysis

After writing the sum of cubes this way, we might think we should check to see if the trinomial portion can be factored further. However, the trinomial portion cannot be factored, so we do not need to check.

###  Try It  #6

Factor the sum of cubes:  216 a 3 + b 3 . 216 a 3 + b 3 .

###  Example  7

#### Factoring a Difference of Cubes

Factor  8 x 3 −125. 8 x 3 −125.

####  Solution

Notice that  8 x 3 8 x 3 and  125 125 are cubes because  8 x 3 = (2x) 3 8 x 3 = (2x) 3 and  125= 5 3 . 125= 5 3 . Write the difference of cubes as  (2x−5)(4 x 2 +10x+25). (2x−5)(4 x 2 +10x+25).

#### Analysis

Just as with the sum of cubes, we will not be able to further factor the trinomial portion.

###  Try It  #7

Factor the difference of cubes:  1,000 x 3 −1. 1,000 x 3 −1.

### Factoring Expressions with Fractional or Negative Exponents

Expressions with fractional or negative exponents can be factored by pulling out a GCF. Look for the variable or exponent that is common to each term of the expression and pull out that variable or exponent raised to the lowest power. These expressions follow the same factoring rules as those with integer exponents. For instance,  2 x 1 4 +5 x 3 4 2 x 1 4 +5 x 3 4 can be factored by pulling out  x 1 4 x 1 4 and being rewritten as  x 1 4 (2+5 x 1 2 ). x 1 4 (2+5 x 1 2 ).

###  Example  8

#### Factoring an Expression with Fractional or Negative Exponents

Factor  3x (x+2) −1 3 +4 (x+2) 2 3 . 3x (x+2) −1 3 +4 (x+2) 2 3 .

####  Solution

Factor out the term with the lowest value of the exponent. In this case, that would be  ( x+2 ) − 1 3 . ( x+2 ) − 1 3 .

(x+2) − 1 3 (3x+4(x+2)) Factor out the GCF. (x+2) − 1 3 (3x+4x+8) Simplify. (x+2) − 1 3 (7x+8) (x+2) − 1 3 (3x+4(x+2)) Factor out the GCF. (x+2) − 1 3 (3x+4x+8) Simplify. (x+2) − 1 3 (7x+8)

###  Try It  #8

Factor  2 (5a−1) 3 4 +7a (5a−1) − 1 4 . 2 (5a−1) 3 4 +7a (5a−1) − 1 4 .

###  Media

Access these online resources for additional instruction and practice with factoring polynomials.

  * [Identify GCF](<http://openstax.org/l/findgcftofact>)
  * [Factor Trinomials when a Equals 1](<http://openstax.org/l/facttrinom1>)
  * [Factor Trinomials when a is not equal to 1](<http://openstax.org/l/facttrinom2>)
  * [Factor Sum or Difference of Cubes](<http://openstax.org/l/sumdifcube>)

###  1.5 Section Exercises

#### Verbal

[1](<chapter-1>). 

If the terms of a polynomial do not have a GCF, does that mean it is not factorable? Explain.

2. 

A polynomial is factorable, but it is not a perfect square trinomial or a difference of two squares. Can you factor the polynomial without finding the GCF?

[3](<chapter-1>). 

How do you factor by grouping?

#### Algebraic

For the following exercises, find the greatest common factor.

4. 

14x+4xy−18x y 2 14x+4xy−18x y 2

[5](<chapter-1>). 

49m b 2 −35 m 2 ba+77m a 2 49m b 2 −35 m 2 ba+77m a 2

6. 

30 x 3 y−45 x 2 y 2 +135x y 3 30 x 3 y−45 x 2 y 2 +135x y 3

[7](<chapter-1>). 

200 p 3 m 3 −30 p 2 m 3 +40 m 3 200 p 3 m 3 −30 p 2 m 3 +40 m 3

8. 

36 j 4 k 2 −18 j 3 k 3 +54 j 2 k 4 36 j 4 k 2 −18 j 3 k 3 +54 j 2 k 4

[9](<chapter-1>). 

6 y 4 −2 y 3 +3 y 2 −y 6 y 4 −2 y 3 +3 y 2 −y

For the following exercises, factor by grouping.

10. 

6 x 2 +5x−4 6 x 2 +5x−4

[11](<chapter-1>). 

2 a 2 +9a−18 2 a 2 +9a−18

12. 

6 c 2 +41c+63 6 c 2 +41c+63

[13](<chapter-1>). 

6 n 2 −19n−11 6 n 2 −19n−11

14. 

20 w 2 −47w+24 20 w 2 −47w+24

[15](<chapter-1>). 

2 p 2 −5p−7 2 p 2 −5p−7

For the following exercises, factor the polynomial.

16. 

7 x 2 +48x−7 7 x 2 +48x−7

[17](<chapter-1>). 

10 h 2 −9h−9 10 h 2 −9h−9

18. 

2 b 2 −25b−247 2 b 2 −25b−247

[19](<chapter-1>). 

9 d 2 −73d+8 9 d 2 −73d+8

20. 

90 v 2 −181v+90 90 v 2 −181v+90

[21](<chapter-1>). 

12 t 2 +t−13 12 t 2 +t−13

22. 

2 n 2 −n−15 2 n 2 −n−15

[23](<chapter-1>). 

16 x 2 −100 16 x 2 −100

24. 

25 y 2 −196 25 y 2 −196

[25](<chapter-1>). 

121 p 2 −169 121 p 2 −169

26. 

4 m 2 −9 4 m 2 −9

[27](<chapter-1>). 

361 d 2 −81 361 d 2 −81

28. 

324 x 2 −121 324 x 2 −121

[29](<chapter-1>). 

144 b 2 −25 c 2 144 b 2 −25 c 2

30. 

16 a 2 −8a+1 16 a 2 −8a+1

[31](<chapter-1>). 

49 n 2 +168n+144 49 n 2 +168n+144

32. 

121 x 2 −88x+16 121 x 2 −88x+16

[33](<chapter-1>). 

225 y 2 +120y+16 225 y 2 +120y+16

34. 

m 2 −20m+100 m 2 −20m+100

[35](<chapter-1>). 

25 p 2 −120p+144 25 p 2 −120p+144

36. 

36 q 2 +60q+25 36 q 2 +60q+25

For the following exercises, factor the polynomials.

[37](<chapter-1>). 

x 3 +216 x 3 +216

38. 

27 y 3 −8 27 y 3 −8

[39](<chapter-1>). 

125 a 3 +343 125 a 3 +343

40. 

b 3 −8 d 3 b 3 −8 d 3

[41](<chapter-1>). 

64 x 3 −125 64 x 3 −125

42. 

729 q 3 +1331 729 q 3 +1331

[43](<chapter-1>). 

125 r 3 +1,728 s 3 125 r 3 +1,728 s 3

44. 

4x ( x−1 ) − 2 3 +3 ( x−1 ) 1 3 4x ( x−1 ) − 2 3 +3 ( x−1 ) 1 3

[45](<chapter-1>). 

3c ( 2c+3 ) − 1 4 −5 ( 2c+3 ) 3 4 3c ( 2c+3 ) − 1 4 −5 ( 2c+3 ) 3 4

46. 

3t ( 10t+3 ) 1 3 +7 ( 10t+3 ) 4 3 3t ( 10t+3 ) 1 3 +7 ( 10t+3 ) 4 3

[47](<chapter-1>). 

14x ( x+2 ) − 2 5 +5 ( x+2 ) 3 5 14x ( x+2 ) − 2 5 +5 ( x+2 ) 3 5

48. 

9y (3y−13) 1 5 −2 (3y−13) 6 5 9y (3y−13) 1 5 −2 (3y−13) 6 5

[49](<chapter-1>). 

5z (2z−9) − 3 2 +11 (2z−9) − 1 2 5z (2z−9) − 3 2 +11 (2z−9) − 1 2

50. 

6d ( 2d+3 ) − 1 6 +5 ( 2d+3 ) 5 6 6d ( 2d+3 ) − 1 6 +5 ( 2d+3 ) 5 6

#### Real-World Applications

For the following exercises, consider this scenario:

Charlotte has appointed a chairperson to lead a city beautification project. The first act is to install statues and fountains in one of the city’s parks. The park is a rectangle with an area of  98 x 2 +105x−27 98 x 2 +105x−27 m2, as shown in the figure below. The length and width of the park are perfect factors of the area.

![A rectangle that’s textured to look like a field. The field is labeled: l times w = ninety-eight times x squared plus one hundred five times x minus twenty-seven.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/8bcfe6d47aadc0aa739ce9f3bf1e19b527e1cecf)

[51](<chapter-1>). 

Factor by grouping to find the length and width of the park.

52. 

A statue is to be placed in the center of the park. The area of the base of the statue is  4 x 2 +12x+9 m 2 . 4 x 2 +12x+9 m 2 . Factor the area to find the lengths of the sides of the statue.

[53](<chapter-1>). 

At the northwest corner of the park, the city is going to install a fountain. The area of the base of the fountain is  9 x 2 −25 m 2 . 9 x 2 −25 m 2 . Factor the area to find the lengths of the sides of the fountain.

For the following exercise, consider the following scenario:

A school is installing a flagpole in the central plaza. The plaza is a square with side length 100 yd. as shown in the figure below. The flagpole will take up a square plot with area  x 2 −6x+9 x 2 −6x+9 yd2.

![A square that’s textured to look like a field with a missing piece in the shape of a square in the center. The sides of the larger square are labeled: 100 yards. The center square is labeled: Area: x squared minus six times x plus nine.](/apps/image-cdn/v1/f=webp/apps/archive/20260604.144757/resources/53d3121a069310415e1ca28ff697e01ba6148d86)

54. 

Find the length of the base of the flagpole by factoring.

#### Extensions

For the following exercises, factor the polynomials completely.

[55](<chapter-1>). 

16 x 4 −200 x 2 +625 16 x 4 −200 x 2 +625

56. 

81 y 4 −256 81 y 4 −256

[57](<chapter-1>). 

16 z 4 −2,401 a 4 16 z 4 −2,401 a 4

58. 

5x ( 3x+2 ) − 2 4 + ( 12x+8 ) 3 2 5x ( 3x+2 ) − 2 4 + ( 12x+8 ) 3 2

[59](<chapter-1>). 

(32 x 3 +48 x 2 −162x−243) −1 (32 x 3 +48 x 2 −162x−243) −1

