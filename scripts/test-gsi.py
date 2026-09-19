"""uv run --with pillow --with numpy scripts/test-gsi.py"""
import importlib.util, unittest
from pathlib import Path
import numpy as np
spec=importlib.util.spec_from_file_location('gsi',Path(__file__).with_name('build-iwanai-gsi.py'))
gsi=importlib.util.module_from_spec(spec);spec.loader.exec_module(gsi)
class GsiTests(unittest.TestCase):
    def test_signed_elevation_and_nodata(self):
        values=gsi.decode(np.array([[0,0,0],[0,3,232],[255,255,156],[128,0,0]],dtype=np.uint8))
        np.testing.assert_allclose(values[:3],[0,10,-1])
        self.assertTrue(np.isnan(values[3]))
    def test_projection_known_tile_and_north_south(self):
        x,y=gsi.pixel(140.5124,42.94,14)
        self.assertEqual((int(x)//256,int(y)//256),(14586,6024))
        self.assertLess(gsi.pixel(140.5124,42.95,14)[1],y)
        self.assertGreater(gsi.pixel(140.52,42.94,14)[0],x)
if __name__=='__main__':unittest.main()
