"""Prepare a personal face mesh locally. Does not upload the portrait."""
from pathlib import Path
import sys
import json
import hashlib

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools' / 'python'))
import mediapipe as mp
from mediapipe.tasks.python.vision.face_landmarker import FaceLandmarksConnections
from PIL import Image

source = ROOT / 'myPic.jpg'
model = ROOT / 'Assets/FaceSources/face_landmarker.task'
options = mp.tasks.vision.FaceLandmarkerOptions(
    base_options=mp.tasks.BaseOptions(model_asset_path=str(model)),
    running_mode=mp.tasks.vision.RunningMode.IMAGE,
    num_faces=1,
)
with mp.tasks.vision.FaceLandmarker.create_from_options(options) as detector:
    result = detector.detect(mp.Image.create_from_file(str(source)))
if len(result.face_landmarks) != 1:
    raise RuntimeError('Expected one clearly detected face.')
points = [[round(p.x, 7), round(p.y, 7), round(p.z, 7)] for p in result.face_landmarks[0]]
assert len(points) == 478
connections = FaceLandmarksConnections
tess = connections.FACE_LANDMARKS_TESSELATION
edges = sorted(set(tuple(sorted((c.start, c.end))) for c in tess))
contours = sorted(set(tuple(sorted((c.start, c.end))) for c in connections.FACE_LANDMARKS_CONTOURS))
iris = [*connections.FACE_LANDMARKS_LEFT_IRIS, *connections.FACE_LANDMARKS_RIGHT_IRIS]
contours += [(c.start, c.end) for c in iris]
triangles = []
for i in range(0, len(tess), 3):
    a, b, c = tess[i:i+3]
    assert a.end == b.start and b.end == c.start and c.end == a.start
    triangles.append([a.start, a.end, b.end])
width, height = Image.open(source).size
payload = {
    'source': 'myPic.jpg', 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(),
    'model': 'MediaPipe Face Landmarker float16/1', 'mediapipeVersion': mp.__version__,
    'modelSha256': hashlib.sha256(model.read_bytes()).hexdigest(),
    'imageWidth': width, 'imageHeight': height, 'count': len(points),
    'coordinateSystem': 'normalized image x-right y-down; relative z; unmirrored full image',
    'points': points, 'edges': edges, 'contours': contours, 'triangles': triangles,
}
out = ROOT / 'public/data/face-landmarks.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps(payload, separators=(',', ':')), encoding='utf-8')
print(f'Exported {len(points)} landmarks, {len(edges)} edges, {len(triangles)} triangles; image {width}x{height}')
