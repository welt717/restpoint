// AnalyticsDashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab } from 'react-bootstrap';
import { Doughnut, Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const AnalyticsDashboard = () => {
  const [carData, setCarData] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [studentData, setStudentData] = useState([]);

  useEffect(() => {
    // Simulated API calls
    const fetchData = async () => {
      // Replace with actual API endpoints
      const carResponse = await fetch('/api/policies/car');
      const healthResponse = await fetch('/api/policies/health');
      const studentResponse = await fetch('/api/policies/student');
      
      setCarData(await carResponse.json());
      setHealthData(await healthResponse.json());
      setStudentData(await studentResponse.json());
    };
    
    fetchData();
  }, []);

  // Car Insurance Charts
  const carInsuranceTypeData = {
    labels: ['Comprehensive', 'Third Party'],
    datasets: [{
      data: carData.reduce((acc, policy) => {
        policy.insuranceType === 'COMPREHENSIVE' ? acc[0]++ : acc[1]++;
        return acc;
      }, [0, 0]),
      backgroundColor: ['#36A2EB', '#FFCE56']
    }]
  };

  const carBodyTypeData = {
    labels: Array.from(new Set(carData.map(p => p.carDetails.bodyType))),
    datasets: [{
      label: 'Body Type Distribution',
      data: Array.from(new Set(carData.map(p => p.carDetails.bodyType))).map(bodyType => 
        carData.filter(p => p.carDetails.bodyType === bodyType).length
      ),
      backgroundColor: '#4BC0C0'
    }]
  };

  // Health Insurance Charts
  const coverageTypeData = {
    labels: Array.from(new Set(healthData.map(p => p.healthDetails.coverageType))),
    datasets: [{
      label: 'Coverage Types',
      data: Array.from(new Set(healthData.map(p => p.healthDetails.coverageType))).map(type => 
        healthData.filter(p => p.healthDetails.coverageType === type).length
      ),
      backgroundColor: '#FF6384'
    }]
  };

  const dependentsData = {
    labels: healthData.map(p => `Policy ${p.policyNumber}`),
    datasets: [{
      label: 'Number of Dependents',
      data: healthData.map(p => p.healthDetails.dependents),
      backgroundColor: '#36A2EB'
    }]
  };

  // Student Insurance Charts
  const schoolDistributionData = {
    labels: Array.from(new Set(studentData.map(p => p.studentDetails.school))),
    datasets: [{
      label: 'Schools Distribution',
      data: Array.from(new Set(studentData.map(p => p.studentDetails.school))).map(school => 
        studentData.filter(p => p.studentDetails.school === school).length
      ),
      backgroundColor: '#FFCE56'
    }]
  };

  const courseDistributionData = {
    labels: Array.from(new Set(studentData.map(p => p.studentDetails.course))),
    datasets: [{
      label: 'Courses Distribution',
      data: Array.from(new Set(studentData.map(p => p.studentDetails.course))).map(course => 
        studentData.filter(p => p.studentDetails.course === course).length
      ),
      backgroundColor: '#4BC0C0'
    }]
  };

  return (
    <Container fluid>
      <h2 className="my-4">Insurance Analytics Dashboard</h2>
      
      <Tabs defaultActiveKey="car" className="mb-3">
        {/* Car Insurance Tab */}
        <Tab eventKey="car" title="Car Insurance">
          <Row className="g-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Insurance Type Distribution</Card.Title>
                  <Doughnut data={carInsuranceTypeData} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Body Type Distribution</Card.Title>
                  <Bar data={carBodyTypeData} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Color Distribution</Card.Title>
                  <Pie data={{
                    labels: Array.from(new Set(carData.map(p => p.carDetails.color))),
                    datasets: [{
                      data: Array.from(new Set(carData.map(p => p.carDetails.color))).map(color => 
                        carData.filter(p => p.carDetails.color === color).length
                      ),
                      backgroundColor: Array.from(new Set(carData.map(p => p.carDetails.color)))
                    }]
                  }} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Health Insurance Tab */}
        <Tab eventKey="health" title="Health Insurance">
          <Row className="g-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Coverage Types</Card.Title>
                  <Bar data={coverageTypeData} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Dependents Distribution</Card.Title>
                  <Line data={dependentsData} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Pre-existing Conditions</Card.Title>
                  <Doughnut data={{
                    labels: ['With Conditions', 'Without Conditions'],
                    datasets: [{
                      data: [
                        healthData.filter(p => p.healthDetails.preExisting).length,
                        healthData.filter(p => !p.healthDetails.preExisting).length
                      ],
                      backgroundColor: ['#FF6384', '#36A2EB']
                    }]
                  }} />
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Tab>

        {/* Student Insurance Tab */}
        <Tab eventKey="student" title="Student Insurance">
          <Row className="g-4">
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>School Distribution</Card.Title>
                  <Bar data={schoolDistributionData} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card>
                <Card.Body>
                  <Card.Title>Course Distribution</Card.Title>
                  <Pie data={courseDistributionData} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
  <Card>
    <Card.Body>
      <Card.Title>Admission Trends</Card.Title>
      <Line 
        data={{
          labels: Array.from(new Set(studentData.map(p => new Date(p.startDate).getFullYear()))), // Fixed closing bracket
          datasets: [{
            label: 'Admissions per Year',
            data: Array.from(new Set(studentData.map(p => new Date(p.startDate).getFullYear()))).map(year => 
              studentData.filter(p => new Date(p.startDate).getFullYear() === year).length
            ),
            borderColor: '#4BC0C0',
            tension: 0.1
          }]
        }} 
      />
    </Card.Body>
  </Card>
</Col>

          </Row>
        </Tab>
      </Tabs>
    </Container>
  );
};

export default AnalyticsDashboard;