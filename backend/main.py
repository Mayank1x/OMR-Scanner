import cv2
import numpy as np
import csv
from typing import List, Dict, Any
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import io

app = FastAPI(title="OMR Scanner API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Constants for image processing
CANNY_THRESH1 = 50
CANNY_THRESH2 = 150
BUBBLE_MIN_AREA = 100
BUBBLE_ASPECT_RATIO_MIN = 0.8
BUBBLE_ASPECT_RATIO_MAX = 1.2

def process_omr_image(image_bytes: bytes, answer_key: Dict[int, int]) -> Dict[str, Any]:
    # 1. Convert bytes to numpy array then to cv2 image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError("Could not decode image.")

    # Convert to Grayscale & Gaussian Blur
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Canny Edge Detection
    edged = cv2.Canny(blurred, CANNY_THRESH1, CANNY_THRESH2)

    # Contour detection for document boundary
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    doc_cnt = None

    if len(contours) > 0:
        # Sort contours by area in descending order
        contours = sorted(contours, key=cv2.contourArea, reverse=True)
        for c in contours:
            peri = cv2.arcLength(c, True)
            approx = cv2.approxPolyDP(c, 0.02 * peri, True)
            # If our approximated contour has four points, we can assume it's the paper
            if len(approx) == 4:
                doc_cnt = approx
                break
    
    # If no document was found, let's just attempt to process the whole image natively or raise error
    if doc_cnt is not None:
        # Perspective Transform
        # Obtain bird's eye view
        doc_cnt = doc_cnt.reshape(4, 2)
        
        # Order points: Top-left, Top-right, Bottom-right, Bottom-left
        rect = np.zeros((4, 2), dtype="float32")
        s = doc_cnt.sum(axis=1)
        rect[0] = doc_cnt[np.argmin(s)]
        rect[2] = doc_cnt[np.argmax(s)]
        diff = np.diff(doc_cnt, axis=1)
        rect[1] = doc_cnt[np.argmin(diff)]
        rect[3] = doc_cnt[np.argmax(diff)]

        (tl, tr, br, bl) = rect
        widthA = np.sqrt(((br[0] - bl[0]) ** 2) + ((br[1] - bl[1]) ** 2))
        widthB = np.sqrt(((tr[0] - tl[0]) ** 2) + ((tr[1] - tl[1]) ** 2))
        maxWidth = max(int(widthA), int(widthB))

        heightA = np.sqrt(((tr[0] - br[0]) ** 2) + ((tr[1] - br[1]) ** 2))
        heightB = np.sqrt(((tl[0] - bl[0]) ** 2) + ((tl[1] - bl[1]) ** 2))
        maxHeight = max(int(heightA), int(heightB))

        dst = np.array([
            [0, 0],
            [maxWidth - 1, 0],
            [maxWidth - 1, maxHeight - 1],
            [0, maxHeight - 1]], dtype="float32")

        M = cv2.getPerspectiveTransform(rect, dst)
        warped = cv2.warpPerspective(gray, M, (maxWidth, maxHeight))
    else:
        warped = gray.copy() # Fallback

    # Otsu's thresholding for binarization
    thresh = cv2.threshold(warped, 0, 255, cv2.THRESH_BINARY_INV | cv2.THRESH_OTSU)[1]

    # Contour detection for bubbles
    cnts, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    question_cnts = []

    for c in cnts:
        (x, y, w, h) = cv2.boundingRect(c)
        ar = w / float(h)
        area = cv2.contourArea(c)
        
        # Filtering by circular aspect ratio and area
        if area >= BUBBLE_MIN_AREA and BUBBLE_ASPECT_RATIO_MIN <= ar <= BUBBLE_ASPECT_RATIO_MAX:
            question_cnts.append(c)

    # Sort top to bottom
    if len(question_cnts) == 0:
        raise ValueError("Could not find any circular bubbles on the document. Ensure image is clear.")
    
    def get_cnt_y(c):
        M = cv2.moments(c)
        try: return int(M["m01"] / M["m00"])
        except: return cv2.boundingRect(c)[1]
    
    question_cnts = sorted(question_cnts, key=get_cnt_y)
    
    options_per_q = 4
    
    score = 0
    results = []
    
    # Group by rows
    total_questions = len(question_cnts) // options_per_q
    
    # We sort each group (row) left-to-right
    for (q, i) in enumerate(range(0, len(question_cnts), options_per_q)):
        if i + options_per_q > len(question_cnts):
            break
            
        row_cnts = question_cnts[i:i + options_per_q]
        row_cnts = sorted(row_cnts, key=lambda c: cv2.boundingRect(c)[0])
        
        bubbled = None
        max_pixels = 0
        
        for (j, c) in enumerate(row_cnts):
            # Mask the bubble
            mask = np.zeros(thresh.shape, dtype="uint8")
            cv2.drawContours(mask, [c], -1, 255, -1)

            # Count non-zero pixels inside bubble mask
            mask = cv2.bitwise_and(thresh, thresh, mask=mask)
            total_pixels = cv2.countNonZero(mask)

            if bubbled is None or total_pixels > max_pixels:
                bubbled = j
                max_pixels = total_pixels
                
        # Compare with answer key
        correct = False
        
        expected_ans = answer_key.get(q)
        if expected_ans == bubbled:
            correct = True
            score += 1

        results.append({
            "question_num": q + 1,        # 1-indexed for display
            "selected_option": bubbled,
            "correct_option": expected_ans,
            "is_correct": correct
        })
        
    return {
        "score": score,
        "max_score": len(answer_key),
        "results": results,
    }

def parse_csv_to_dict(csv_bytes: bytes) -> Dict[int, int]:
    # Expects format like:
    # QuestionNum,OptionIdx
    # 1,1
    # 2,2
    # etc...
    # Where QuestionNum is 1-indexed in CSV, but our dictionary uses 0-indexed internally
    csv_str = csv_bytes.decode('utf-8')
    reader = csv.reader(io.StringIO(csv_str))
    
    # Convert options: might be numbers (0,1,2,3) or letters A,B,C,D
    def char_to_idx(val: str) -> int:
        val = val.strip().upper()
        if val in ['A', 'B', 'C', 'D']:
             return {'A': 0, 'B': 1, 'C': 2, 'D': 3}[val]
        if val.isdigit():
             return int(val)
        return -1
        
    answer_key = {}
    header_skipped = False
    
    for row in reader:
        if not row or len(row) < 2: 
            continue
        try:
            q_num_str = row[0].strip()
            # If header row
            if not q_num_str.isdigit() and not header_skipped:
                header_skipped = True
                continue
                
            q_num = int(q_num_str) - 1 # 0-indexed internally
            opt_idx = char_to_idx(row[1])
            if opt_idx >= 0:
                answer_key[q_num] = opt_idx
        except ValueError:
             pass # skip broken lines

    return answer_key

@app.post("/grade-omr-bulk/")
async def grade_omr_bulk(
    images: List[UploadFile] = File(...),
    answer_key_csv: UploadFile = File(...)
):
    """
    Accepts:
    1. A single CSV file containing the answer key
    2. A list of image files (students' OMR sheets)
    Returns list of score dictionaries.
    """
    
    try:
        csv_bytes = await answer_key_csv.read()
        answer_key = parse_csv_to_dict(csv_bytes)
        
        if not answer_key:
             raise HTTPException(status_code=400, detail="Invalid or empty Answer Key CSV")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV: {str(e)}")

    batch_results = []
    
    for img_file in images:
        try:
            img_bytes = await img_file.read()
            res = process_omr_image(img_bytes, answer_key)
            
            batch_results.append({
                "filename": img_file.filename,
                "success": True,
                "data": res
            })
        except Exception as e:
            batch_results.append({
                "filename": img_file.filename,
                "success": False,
                "error": str(e)
            })

    return {"batch_results": batch_results}
