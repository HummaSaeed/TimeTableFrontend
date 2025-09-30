import React, { useState } from 'react';


import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';


import { useAuth } from '../../contexts/AuthContext';


import { useNavigate, Link } from 'react-router-dom';

import { checkAPIHealth } from '../../services/api';



const Login = () => {

  const [formData, setFormData] = useState({

    email: '',

    password: ''


  });


  const [showPassword, setShowPassword] = useState(false);

  const [userType, setUserType] = useState('school');


  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, error, clearError, loading } = useAuth();


  const navigate = useNavigate();




  const handleInputChange = (field, value) => {

    setFormData(prev => ({

      ...prev,

      [field]: value

    }));

    if (error) clearError();

  };



  const handleSubmit = async (e) => {

    e.preventDefault();

    if (isSubmitting) return;

    
    
    setIsSubmitting(true);

    clearError();

    
    
    try {

      await login(formData, userType);

      navigate('/dashboard');

    } catch (error) {

      console.error('Login error:', error);

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleDemoLogin = async () => {

    if (isSubmitting) return;

    
    
    setIsSubmitting(true);

    clearError();

    
    
    try {

      const demoCredentials = {

        email: 'fg@gmail.com',

        password: 'demo123'

      };

      
      
      await login(demoCredentials, 'school');

      navigate('/dashboard');

    } catch (error) {

      console.error('Demo login error:', error);

    } finally {

      setIsSubmitting(false);

    }

  };



  const handleTestConnection = async () => {

    try {

      const isHealthy = await checkAPIHealth();

      if (isHealthy) {

        alert('✅ API connection successful!');

      } else {

        alert('❌ API connection failed. Please check if the Django server is running.');

      }

    } catch (error) {

      alert('❌ API connection test failed: ' + error.message);

    }

  };



  return (

    <div className="min-vh-100 d-flex align-items-center" 

         style={{ 

           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

           position: 'relative',

           overflow: 'hidden'

         }}>
      
      
      
      {/* Background Pattern */}

      <div className="position-absolute w-100 h-100" style={{ opacity: 0.1 }}>

        <div className="position-absolute" style={{ top: '10%', left: '10%', fontSize: '8rem', color: 'white' }}>

          🏫

        </div>

        <div className="position-absolute" style={{ top: '60%', right: '15%', fontSize: '6rem', color: 'white' }}>

          📚

        </div>

        <div className="position-absolute" style={{ bottom: '20%', left: '20%', fontSize: '4rem', color: 'white' }}>

          👨‍🏫

        </div>

      </div>



      <Container>

        <Row className="justify-content-center">

          <Col lg={10} xl={8}>

            <Card className="border-0 shadow-lg" style={{ borderRadius: '20px' }}>

              <Card.Body className="p-0">

                <Row className="g-0">

                  {/* Left Section - Welcome & Info */}

                  <Col lg={6} className="d-none d-lg-block">

                    <div className="h-100 p-5 text-white" 

                         style={{ 

                           background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',

                           borderRadius: '20px 0 0 20px'

                         }}>

                      <div className="text-center">

                        <div className="bg-white bg-opacity-20 p-4 rounded-circle d-inline-block mb-4">

                          <i className="fas fa-school fa-3x text-white"></i>

                        </div>

                        <h2 className="fw-bold mb-3">Welcome to School Manager</h2>

                        <p className="lead mb-4">

                          The complete school management solution for modern education

                        </p>

                        
                        
                        <div className="text-start">

                          <div className="d-flex align-items-center mb-3">

                            <div className="bg-white bg-opacity-20 p-2 rounded-circle me-3">

                              <i className="fas fa-calendar-alt text-white"></i>

                            </div>

                            <span>Smart Timetable Management</span>

                          </div>

                          <div className="d-flex align-items-center mb-3">

                            <div className="bg-white bg-opacity-20 p-2 rounded-circle me-3">

                              <i className="fas fa-users text-white"></i>

                            </div>

                            <span>Teacher & Class Management</span>

                          </div>

                          <div className="d-flex align-items-center mb-3">

                            <div className="bg-white bg-opacity-20 p-2 rounded-circle me-3">

                              <i className="fas fa-chart-line text-white"></i>

                            </div>

                            <span>Analytics & Reports</span>

                          </div>

                          <div className="d-flex align-items-center">

                            <div className="bg-white bg-opacity-20 p-2 rounded-circle me-3">

                              <i className="fas fa-mobile-alt text-white"></i>

                            </div>

                            <span>Mobile Responsive Design</span>

                          </div>

                        </div>

                      </div>

                    </div>

                  </Col>



                  {/* Right Section - Login Form */}

                  <Col lg={6}>

                    <div className="p-5">

                      <div className="text-center mb-4">

                        <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">

                          <i className="fas fa-user-lock fa-2x text-primary"></i>

                        </div>

                        <h3 className="fw-bold mb-2">Sign In</h3>

                        <p className="text-muted">Access your school management dashboard</p>

                      </div>



                      {error && (

                        <Alert variant="danger" onClose={clearError} dismissible>

                          <i className="fas fa-exclamation-triangle me-2"></i>

                          {error}

                        </Alert>

                      )}



                      <Tabs

                        defaultActiveKey="school"

                        className="mb-4"

                        onSelect={(k) => setUserType(k)}

                      >

                        <Tab eventKey="school" title={

                          <span>

                            <i className="fas fa-school me-2"></i>

                            School Admin

                          </span>

                        }>

                          <Form onSubmit={handleSubmit}>

                            <Form.Group className="mb-3">

                              <Form.Label>Email Address</Form.Label>

                              <Form.Control

                                type="email"

                                placeholder="Enter your email"

                                value={formData.email}

                                onChange={(e) => handleInputChange('email', e.target.value)}

                                required

                                disabled={isSubmitting}

                                className="form-control-lg"

                              />

                            </Form.Group>



                            <Form.Group className="mb-3">

                              <Form.Label>Password</Form.Label>

                              <div className="position-relative">

                                <Form.Control

                                  type={showPassword ? "text" : "password"}

                                  placeholder="Enter your password"

                                  value={formData.password}

                                  onChange={(e) => handleInputChange('password', e.target.value)}

                                  required

                                  disabled={isSubmitting}

                                  className="form-control-lg"

                                />

                                <Button

                                  type="button"

                                  variant="link"

                                  className="position-absolute end-0 top-0 h-100 text-decoration-none"

                                  onClick={() => setShowPassword(!showPassword)}

                                  disabled={isSubmitting}

                                >

                                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>

                                </Button>

                              </div>

                            </Form.Group>



                            <div className="d-flex justify-content-between align-items-center mb-4">

                              <Form.Check

                                type="checkbox"

                                id="remember"

                                label="Remember me"

                                disabled={isSubmitting}

                              />

                              <Link to="/forgot-password" className="text-decoration-none text-primary">

                                Forgot Password?

                              </Link>

                            </div>



                            <Button

                              type="submit"

                              variant="primary"

                              size="lg"

                              className="w-100 mb-3"

                              disabled={isSubmitting || loading}

                            >

                              {isSubmitting ? (

                                <>

                                  <Spinner

                                    as="span"

                                    animation="border"

                                    size="sm"

                                    role="status"

                                    aria-hidden="true"

                                    className="me-2"

                                  />

                                  Signing In...

                                </>

                              ) : (

                                'Sign In as School Admin'

                              )}

                            </Button>

                          </Form>

                        </Tab>



                        <Tab eventKey="teacher" title={

                          <span>

                            <i className="fas fa-chalkboard-teacher me-2"></i>

                            Teacher

                          </span>

                        }>

                          <Form onSubmit={handleSubmit}>

                            <Form.Group className="mb-3">

                              <Form.Label>Email Address</Form.Label>

                              <Form.Control

                                type="email"

                                placeholder="Enter your email"

                                value={formData.email}

                                onChange={(e) => handleInputChange('email', e.target.value)}

                                required

                                disabled={isSubmitting}

                                className="form-control-lg"

                              />

                            </Form.Group>



                            <Form.Group className="mb-3">

                              <Form.Label>Password</Form.Label>

                              <div className="position-relative">

                                <Form.Control

                                  type={showPassword ? "text" : "password"}

                                  placeholder="Enter your password"

                                  value={formData.password}

                                  onChange={(e) => handleInputChange('password', e.target.value)}

                                  required

                                  disabled={isSubmitting}

                                  className="form-control-lg"

                                />

                                <Button

                                  type="button"

                                  variant="link"

                                  className="position-absolute end-0 top-0 h-100 text-decoration-none"

                                  onClick={() => setShowPassword(!showPassword)}

                                  disabled={isSubmitting}

                                >

                                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>

                                </Button>

                              </div>

                            </Form.Group>



                            <div className="d-flex justify-content-between align-items-center mb-4">

                              <Form.Check

                                type="checkbox"

                                id="remember-teacher"

                                label="Remember me"

                                disabled={isSubmitting}

                              />

                              <Link to="/forgot-password" className="text-decoration-none text-primary">

                                Forgot Password?

                              </Link>

                            </div>



                            <Button

                              type="submit"

                              variant="success"

                              size="lg"

                              className="w-100 mb-3"

                              disabled={isSubmitting || loading}

                            >

                              {isSubmitting ? (

                                <>

                                  <Spinner

                                    as="span"

                                    animation="border"

                                    size="sm"

                                    role="status"

                                    aria-hidden="true"

                                    className="me-2"

                                  />

                                  Signing In...

                                </>

                              ) : (

                                'Sign In as Teacher'

                              )}

                            </Button>

                          </Form>

                        </Tab>

                      </Tabs>



                      {/* Demo Login Button */}

                      <Button

                        type="button"

                        variant="outline-secondary"

                        size="lg"

                        className="w-100 mb-3"

                        onClick={handleDemoLogin}

                        disabled={isSubmitting || loading}

                      >

                        {isSubmitting ? (

                          <>

                            <Spinner

                              as="span"

                              animation="border"

                              size="sm"

                              role="status"

                              aria-hidden="true"

                              className="me-2"

                            />

                            Loading Demo...

                          </>

                        ) : (

                          <>

                            <i className="fas fa-play me-2"></i>

                            Try Demo Account

                          </>

                        )}

                      </Button>



                      {/* API Test Button */}

                      <Button

                        type="button"

                        variant="outline-info"

                        size="sm"

                        className="w-100 mb-3"

                        onClick={handleTestConnection}

                        disabled={isSubmitting || loading}

                      >

                        <i className="fas fa-wifi me-2"></i>

                        Test API Connection

                      </Button>



                      <div className="text-center">

                        <p className="text-muted mb-0">

                          Don't have an account?{' '}

                          <Link to="/register" className="text-decoration-none text-primary fw-bold">

                            Sign Up

                          </Link>

                        </p>

                      </div>

                    </div>

                  </Col>

                </Row>

              </Card.Body>

            </Card>

          </Col>

        </Row>

      </Container>

    </div>

  );

};



export default Login;














                                <Button

                                  type="button"

                                  variant="link"

                                  className="position-absolute end-0 top-0 h-100 text-decoration-none"

                                  onClick={() => setShowPassword(!showPassword)}

                                  disabled={isSubmitting}

                                >

                                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>

                                </Button>

                              </div>

                            </Form.Group>



                            <div className="d-flex justify-content-between align-items-center mb-4">

                              <Form.Check

                                type="checkbox"

                                id="remember"

                                label="Remember me"

                                disabled={isSubmitting}

                              />

                              <Link to="/forgot-password" className="text-decoration-none text-primary">

                                Forgot Password?

                              </Link>

                            </div>



                            <Button

                              type="submit"

                              variant="primary"

                              size="lg"

                              className="w-100 mb-3"

                              disabled={isSubmitting || loading}

                            >

                              {isSubmitting ? (

                                <>

                                  <Spinner

                                    as="span"

                                    animation="border"

                                    size="sm"

                                    role="status"

                                    aria-hidden="true"

                                    className="me-2"

                                  />

                                  Signing In...

                                </>

                              ) : (

                                'Sign In as School Admin'

                              )}

                            </Button>

                          </Form>

                        </Tab>



                        <Tab eventKey="teacher" title={

                          <span>

                            <i className="fas fa-chalkboard-teacher me-2"></i>

                            Teacher

                          </span>

                        }>

                          <Form onSubmit={handleSubmit}>

                            <Form.Group className="mb-3">

                              <Form.Label>Email Address</Form.Label>

                              <Form.Control

                                type="email"

                                placeholder="Enter your email"

                                value={formData.email}

                                onChange={(e) => handleInputChange('email', e.target.value)}

                                required

                                disabled={isSubmitting}

                                className="form-control-lg"

                              />

                            </Form.Group>



                            <Form.Group className="mb-3">

                              <Form.Label>Password</Form.Label>

                              <div className="position-relative">

                                <Form.Control

                                  type={showPassword ? "text" : "password"}

                                  placeholder="Enter your password"

                                  value={formData.password}

                                  onChange={(e) => handleInputChange('password', e.target.value)}

                                  required

                                  disabled={isSubmitting}

                                  className="form-control-lg"

                                />

                                <Button

                                  type="button"

                                  variant="link"

                                  className="position-absolute end-0 top-0 h-100 text-decoration-none"

                                  onClick={() => setShowPassword(!showPassword)}

                                  disabled={isSubmitting}

                                >

                                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>

                                </Button>

                              </div>

                            </Form.Group>



                            <div className="d-flex justify-content-between align-items-center mb-4">

                              <Form.Check

                                type="checkbox"

                                id="remember-teacher"

                                label="Remember me"

                                disabled={isSubmitting}

                              />

                              <Link to="/forgot-password" className="text-decoration-none text-primary">

                                Forgot Password?

                              </Link>

                            </div>



                            <Button

                              type="submit"

                              variant="success"

                              size="lg"

                              className="w-100 mb-3"

                              disabled={isSubmitting || loading}

                            >

                              {isSubmitting ? (

                                <>

                                  <Spinner

                                    as="span"

                                    animation="border"

                                    size="sm"

                                    role="status"

                                    aria-hidden="true"

                                    className="me-2"

                                  />

                                  Signing In...

                                </>

                              ) : (

                                'Sign In as Teacher'

                              )}

                            </Button>

                          </Form>

                        </Tab>

                      </Tabs>



                      {/* Demo Login Button */}

                      <Button

                        type="button"

                        variant="outline-secondary"

                        size="lg"

                        className="w-100 mb-3"

                        onClick={handleDemoLogin}

                        disabled={isSubmitting || loading}

                      >

                        {isSubmitting ? (

                          <>

                            <Spinner

                              as="span"

                              animation="border"

                              size="sm"

                              role="status"

                              aria-hidden="true"

                              className="me-2"

                            />

                            Loading Demo...

                          </>

                        ) : (

                          <>

                            <i className="fas fa-play me-2"></i>

                            Try Demo Account

                          </>

                        )}

                      </Button>



                      {/* API Test Button */}

                      <Button

                        type="button"

                        variant="outline-info"

                        size="sm"

                        className="w-100 mb-3"

                        onClick={handleTestConnection}

                        disabled={isSubmitting || loading}

                      >

                        <i className="fas fa-wifi me-2"></i>

                        Test API Connection

                      </Button>



                      <div className="text-center">

                        <p className="text-muted mb-0">

                          Don't have an account?{' '}

                          <Link to="/register" className="text-decoration-none text-primary fw-bold">

                            Sign Up

                          </Link>

                        </p>

                      </div>

                    </div>

                  </Col>

                </Row>

              </Card.Body>

            </Card>

          </Col>

        </Row>

      </Container>

    </div>

  );

};



export default Login;

















                            <div className="d-flex justify-content-between align-items-center mb-4">

                              <Form.Check

                                type="checkbox"


                                id="remember-teacher"


                                label="Remember me"


                                disabled={isSubmitting}


                              />


                              <Link to="/forgot-password" className="text-decoration-none text-primary">


                                Forgot Password?


                              </Link>


                            </div>




                            <Button


                              type="submit"


                              variant="success"


                              size="lg"


                              className="w-100 mb-3"


                              disabled={isSubmitting || loading}


                            >


                              {isSubmitting ? (


                                <>


                                  <Spinner


                                    as="span"


                                    animation="border"


                                    size="sm"


                                    role="status"


                                    aria-hidden="true"


                                    className="me-2"


                                  />

                                  Signing In...

                                </>


                              ) : (


                                'Sign In as Teacher'


                              )}


                            </Button>


                          </Form>


                        </Tab>


                      </Tabs>




                      {/* Demo Login Button */}


                      <Button


                        type="button"


                        variant="outline-secondary"


                        size="lg"


                        className="w-100 mb-3"


                        onClick={handleDemoLogin}


                        disabled={isSubmitting || loading}


                      >


                        {isSubmitting ? (


                          <>


                            <Spinner


                              as="span"


                              animation="border"


                              size="sm"


                              role="status"


                              aria-hidden="true"


                              className="me-2"


                            />


                            Loading Demo...

                          </>

                        ) : (


                          <>


                            <i className="fas fa-play me-2"></i>


                            Try Demo Account


                          </>


                        )}


                      </Button>




                      {/* API Test Button */}


                      <Button


                        type="button"


                        variant="outline-info"


                        size="sm"

                        className="w-100 mb-3"

                        onClick={handleTestConnection}


                        disabled={isSubmitting || loading}


                      >


                        <i className="fas fa-wifi me-2"></i>


                        Test API Connection


                      </Button>




                      <div className="text-center">


                        <p className="text-muted mb-0">


                          Don't have an account?{' '}


                          <Link to="/register" className="text-decoration-none text-primary fw-bold">


                            Sign Up


                          </Link>


                        </p>


                      </div>


                    </div>


                  </Col>


                </Row>


              </Card.Body>


            </Card>

          </Col>

        </Row>


      </Container>

    </div>

  );

};



export default Login;














