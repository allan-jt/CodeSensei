INFRA = ./src
FRONTEND = ./frontend

REACT_APP = ${FRONTEND}/lib/react-app
DYNAMO_DATA = ${INFRA}/lib/storage/dynamo-stack/scripts

I_CMD = cd ${INFRA} && cdk
F_CMD = cd ${FRONTEND} && cdk


run_infra:
	${I_CMD} deploy --all --require-approval never

run_frontend:
	${F_CMD} deploy --all --require-approval never

build_frontend:
	cd ${REACT_APP} && npm run build

destroy_infra:
	${I_CMD} destroy --all --require-approval never

destroy_frontend:
	${F_CMD} destroy --all --require-approval never

destroy_all: destroy_frontend destroy_infra

destroy_all_prune: destroy_all prune

seed_dynamo:
	cd ${DYNAMO_DATA} && npx ts-node seed-dynamo.ts $(filter-out $@,$(MAKECMDGOALS))

%:
	@:

