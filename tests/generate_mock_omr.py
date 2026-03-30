import cv2
import numpy as np
import os
import requests

def create_mock_omr(filename, num_questions=5, num_options=4):
    width, height = 800, 1000
    # White background (Paper)
    img = np.ones((height, width, 3), dtype=np.uint8) * 255
    
    # Draw reference border so contour detection finds the paper
    cv2.rectangle(img, (20, 20), (width-20, height-20), (0,0,0), 5)
    
    # Title
    cv2.putText(img, "Mock OMR Sheet", (300, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (0,0,0), 2)
    
    start_y = 150
    spacing_y = 60
    start_x = 100
    spacing_x = 80
    radius = 20
    
    # Hardcoded shading for the mock:
    # Q1: B (idx 1), Q2: C (idx 2), Q3: A (idx 0), Q4: D (idx 3), Q5: B (idx 1)
    answers = {0: 1, 1: 2, 2: 0, 3: 3, 4: 1}
    
    for q in range(num_questions):
        y = start_y + q * spacing_y
        cv2.putText(img, f"Q{q+1}", (start_x - 60, y + 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,0), 2)
        
        for p in range(num_options):
            x = start_x + p * spacing_x
            
            # Fill chosen bubble
            if p == answers.get(q, -1):
                cv2.circle(img, (x, y), radius, (0,0,0), -1) # filled
            else:
                cv2.circle(img, (x, y), radius, (0,0,0), 3)  # outline
                
    # Add perspective warp
    pts1 = np.float32([[0,0],[width,0],[0,height],[width,height]])
    pts2 = np.float32([[50,50],[width-100,20],[30,height-50],[width-50,height-100]])
    M = cv2.getPerspectiveTransform(pts1, pts2)
    
    bg = np.zeros((height+200, width+200, 3), dtype=np.uint8)
    # A bit of gray background to test otsu
    bg[:] = (100, 100, 100) 
    
    warped = cv2.warpPerspective(img, M, (width+200, height+200))
    
    # Blend warped into bg properly where it's not black
    mask = np.any(warped != [0,0,0], axis=-1)
    bg[mask] = warped[mask]
    
    if not os.path.exists("tests"):
        os.makedirs("tests")
        
    cv2.imwrite(f"tests/{filename}", bg)
    print(f"Generated tests/{filename}")

def test_fastapi():
    create_mock_omr("mock1.jpg")
    create_mock_omr("mock2.jpg")
    
    # Create a mock CSV
    csv_content = "1,B\n2,C\n3,A\n4,D\n5,B\n"
    with open("tests/mock.csv", "w") as f:
        f.write(csv_content)
        
    print("Testing endpoint /grade-omr-bulk/")
    url = "http://127.0.0.1:8000/grade-omr-bulk/"
    
    files = [
        ('answer_key_csv', ('mock.csv', open('tests/mock.csv', 'rb'), 'text/csv')),
        ('images', ('mock1.jpg', open('tests/mock1.jpg', 'rb'), 'image/jpeg')),
        ('images', ('mock2.jpg', open('tests/mock2.jpg', 'rb'), 'image/jpeg'))
    ]
    
    try:
        r = requests.post(url, files=files)
        print("Status:", r.status_code)
        import json
        print(json.dumps(r.json(), indent=2))
    except Exception as e:
        print("Failed to reach API:", e)

if __name__ == "__main__":
    test_fastapi()
