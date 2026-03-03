'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="grid-item">
            <div>
              <h2 id="masthead">Fostering Technical Culture</h2>
              <h4>Since 2012</h4>
              <p>
                We conduct courses, workshops, host technical competitions, offer financial 
                assistance to technical clubs and projects and organise academic help sessions
              </p>
              <Link href="/catalog">
                <button className="primary">Find Courses</button>
              </Link>
            </div>
            <img src="/hero.svg" alt="Hero" style={{ width: '100%' }} />
          </div>
        </div>
      </section>

      {/* What we do Section */}
      <section className="white" style={{ paddingTop: 0 }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
          <path fill="#f0fdf4" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,138.7C384,149,480,139,576,128C672,117,768,107,864,85.3C960,64,1056,32,1152,48C1248,64,1344,128,1392,160L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <div style={{ backgroundColor: '#f0fdf4' }}>
          <h2 className="section-title" id="first">
            <span>What we do</span>
          </h2>
          <p className="section-desc">
            Center for Technical Education is a technical organisation of BITS Pilani, Goa Campus. 
            We strive to enhance the technical culture on campus through our multiple initiatives.
          </p>
          <div className="container">
            <div className="grid-item">
              <div>
                <h3>AAP</h3>
                <p>
                  A relatively new initiative, the Academic Assistance Programme has been a huge 
                  success in helping the students of BITS Goa grasp concepts, cover difficult 
                  problems and achieve excellence in academic courses. The initiative empowers 
                  students to ask doubts and encounter problems under the guidance of highly 
                  motivated student mentors
                </p>
              </div>
              <img src="/aap.svg" alt="AAP" />
            </div>
            <div className="grid-item">
              <div>
                <h3>Courses</h3>
                <p>
                  Our longest running and most successful venture, courses is a great resource 
                  to expand your knowledge. Courses on a very wide array of topics ranging from 
                  music theory to robotics are taken by highly skilled and dedicated instructors 
                  from BITS goa who wish to pass on their knowledge and actively participate in 
                  the growth of campus tech culture
                </p>
              </div>
              <img src="/courses.svg" alt="Courses" />
            </div>
          </div>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ transform: 'rotate(180deg)' }}>
          <path fill="#f0fdf4" fillOpacity="1" d="M0,64L48,80C96,96,192,128,288,138.7C384,149,480,139,576,128C672,117,768,107,864,85.3C960,64,1056,32,1152,48C1248,64,1344,128,1392,160L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
        <div className="container">
          <div className="grid-item">
            <div>
              <h3>Tech Weekend</h3>
              <p>
                To promote the technical culture on campus, CTE, in collaboration with other 
                technical clubs on campus, organizes a weekend filled with hackathons and 
                competitions. These events range from fields like finance to aero-space and 
                help students relax while encouraging healthy competition
              </p>
            </div>
            <img src="/techweekend.png" alt="Tech Weekend" style={{ width: '100%' }} />
          </div>
          <div className="grid-item">
            <div>
              <h3>Project Fundings</h3>
              <p>
                At CTE, we believe in lending active support to creativity and innovation. 
                CTE funds up to 10 projects with support up to Rs 40,000 to help student 
                teams contribute to the development of technical culture on campus
              </p>
            </div>
            <img src="/funding.svg" alt="Project Funding" />
          </div>
          <div className="grid-item">
            <div>
              <h3>TechForums</h3>
              <p>
                There are communities on campus, interest groups, topics, issues, queries 
                which haven't quite been able to be centralized. We, at CTE, envisioned an 
                online place, one that can answer all these needs. A place with tags, 
                discussions, user-friendly UI, moderators, timed events, and sessions. 
                A one-stop location for all answers.
              </p>
            </div>
            <img src="/techforum.svg" alt="TechForum" />
          </div>
        </div>
      </section>

      {/* Why collaborate Section */}
      <section className="gray" style={{ position: 'relative', display: 'flex' }}>
        <div className="container" style={{ width: '100%' }}>
          <img id="bpgc" src="/bpgc.png" alt="BPGC" />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontWeight: 'bold', justifyContent: 'flex-start' }}>
              <span>Why collaborate with us?</span>
            </h2>
            <p className="section-desc" style={{ margin: 0, textAlign: 'inherit' }}>
              CTE is the premier technical organisation of BITS Goa. We organize many events 
              in collaboration with other organizations and receive both heavy participation 
              and acclaim in such endeavors. We look forward to hearing from you!
            </p>
            <div id="facts-list">
              <div>
                <h2 className="num">3000+</h2>
                <span>Students Taught</span>
              </div>
              <div>
                <h2 className="num">40+</h2>
                <span>Projects Funded</span>
              </div>
              <div>
                <h2 className="num">250K+</h2>
                <span>Cash prizes rewarded</span>
              </div>
              <div>
                <h2 className="num">110+</h2>
                <span>Pizzas Ordered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Team Section */}
      <section className="white">
        <h2 className="section-title">
          <span>Our Team</span>
        </h2>
        <p className="section-desc">
          With a Technical Department this big, come big responsibilities, which our team 
          is used to handle.
        </p>
        <div className="centre-flex">
          <Link href="/team">
            <button className="primary">Meet the Team</button>
          </Link>
        </div>
      </section>
    </div>
  )
}
